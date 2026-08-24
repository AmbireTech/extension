//! Native counterparts to the ethers and viem calls that dominate a portfolio
//! update on mobile.
//!
//! The JS shims fall back to the originals on any error, so refusing work is
//! always safe and returning a value the JS would not have returned never is.
//! Where the two disagree, these functions refuse.

use std::str::FromStr;

use alloy_dyn_abi::{DynSolType, DynSolValue, FunctionExt, JsonAbiExt, Specifier};
use alloy_json_abi::{Function, JsonAbi, Param};
use alloy_primitives::{hex, keccak256 as alloy_keccak256, Address, B256, I256, U256};
use serde_json::{Map, Value};

const HEX_PREFIX: &str = "0x";
const HEX_PREFIX_UPPER: &str = "0X";

/// Must stay in step with `src/ambire-common/src/libs/richJson/richJson.ts`.
const BIGINT_TAG: &str = "$bigint";

/// Where viem switches from a plain JS number to a `BigInt`. See `decodeNumber`
/// in viem's `utils/abi/decodeAbiParameters.js`.
const JS_SAFE_INT_BITS: usize = 48;

/// Returns the 32-byte hash. The JS shim handles hex on both sides.
#[uniffi::export]
pub fn keccak256(input: Vec<u8>) -> Vec<u8> {
    alloy_keccak256(&input).to_vec()
}

/// Not `trim_start_matches`, which strips a repeated prefix, so `0x0x12` would
/// decode rather than fail.
fn strip_one_hex_prefix(value: &str) -> Option<&str> {
    value
        .strip_prefix(HEX_PREFIX)
        .or_else(|| value.strip_prefix(HEX_PREFIX_UPPER))
}

/// `hex::decode` strips a prefix of its own, so without this `0x0x1234` decodes
/// instead of failing. No valid body starts with a prefix, `x` not being a hex
/// digit.
fn reject_repeated_hex_prefix(body: &str) -> Result<&str, AbiError> {
    if strip_one_hex_prefix(body).is_some() {
        return Err(AbiError::InvalidHex {
            msg: "repeated 0x prefix".to_string(),
        });
    }

    Ok(body)
}

/// Accepts what ethers' `isHexString` regex does, `0X` included via its `i` flag.
fn ethers_hex_body(value: &str) -> Result<&str, AbiError> {
    let body = strip_one_hex_prefix(value).ok_or_else(|| AbiError::InvalidHex {
        msg: "missing 0x prefix".to_string(),
    })?;

    reject_repeated_hex_prefix(body)
}

/// Requires the lower-case prefix every viem `Hex` carries. `0X` is refused
/// because no viem regex has an `i` flag on the prefix, so viem either throws or
/// carries the stray `X` into its output.
fn viem_hex_body(value: &str) -> Result<&str, AbiError> {
    let body = value
        .strip_prefix(HEX_PREFIX)
        .ok_or_else(|| AbiError::InvalidHex {
            msg: format!("{value}: expected a lower-case 0x prefix"),
        })?;

    reject_repeated_hex_prefix(body)
}

fn decode_viem_hex(value: &str) -> Result<Vec<u8>, AbiError> {
    let body = viem_hex_body(value)?;

    hex::decode(body).map_err(|e| AbiError::InvalidHex { msg: e.to_string() })
}

/// Accepts only what viem's `isAddress` does. `Address::from_str` alone is too
/// lax: it makes the prefix optional and accepts `0X`, parsing inputs viem
/// rejects outright.
fn parse_viem_address(value: &str) -> Result<Address, AbiError> {
    if !value.starts_with(HEX_PREFIX) {
        return Err(AbiError::InvalidAddress {
            msg: format!("{value}: expected a lower-case 0x prefix"),
        });
    }

    Address::from_str(value).map_err(|e| AbiError::InvalidAddress {
        msg: format!("{value}: {e}"),
    })
}

/// Lowercase `0x` hex, as ethers' `hexlify` and viem's `bytesToHex` produce it.
/// Empty input gives `0x`.
///
/// Only worth the FFI hop for large buffers, so the caller keeps a byte-count
/// threshold and stays in JS below it.
#[uniffi::export]
pub fn bytes_to_hex(input: Vec<u8>) -> String {
    hex::encode_prefixed(input)
}

/// Accepts exactly what ethers' `getBytes` accepts: whole bytes, either case,
/// prefix required.
///
/// # Errors
/// Anything else, so the caller falls back to ethers rather than this changing
/// what an invalid input does.
#[uniffi::export]
pub fn hex_to_bytes(input: String) -> Result<Vec<u8>, AbiError> {
    let body = ethers_hex_body(&input)?;

    hex::decode(body).map_err(|e| AbiError::InvalidHex { msg: e.to_string() })
}

/// EIP-55 checksummed address, as viem's `checksumAddress` produces it. The
/// EIP-1191 chain-id variant stays in JS so there is no second copy of it here.
///
/// # Errors
/// Anything viem's `isAddress` would reject, so those calls fall back to viem.
#[uniffi::export]
pub fn checksum_address(address: String) -> Result<String, AbiError> {
    let parsed = parse_viem_address(&address)?;

    Ok(parsed.to_checksum(None))
}

/// Every way a native ABI call can hand back to viem. The JS shims catch all of
/// these and call the real viem implementation, so an error is a handover rather
/// than a failure.
///
/// Variant order and field types are the FFI wire format, and the TypeScript
/// bindings are generated separately from the library. **Add new variants at the
/// end and leave existing fields alone**: stale bindings throw
/// `UnexpectedEnumCase` on an unknown trailing variant, but read a reordered or
/// resized one as the wrong error with the wrong payload.
#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum AbiError {
    #[error("invalid abi json: {msg}")]
    InvalidAbi { msg: String },
    #[error("function not found in abi: {name}")]
    FunctionNotFound { name: String },
    /// Only the call's arguments can disambiguate, and this API does not take them.
    #[error("{name} is overloaded {count} ways and cannot be resolved by name alone")]
    AmbiguousOverload { name: String, count: u32 },
    #[error("invalid hex: {msg}")]
    InvalidHex { msg: String },
    /// No native implementation, so only viem can serve the call.
    #[error("unsupported abi type: {ty}")]
    UnsupportedType { ty: String },
    #[error("expected {expected} {what}, got {actual}")]
    ArityMismatch {
        what: String,
        expected: u32,
        actual: u32,
    },
    #[error("decode failed: {msg}")]
    DecodeFailed { msg: String },
    #[error("encode failed: {msg}")]
    EncodeFailed { msg: String },
    #[error("bad argument: {msg}")]
    InvalidArgument { msg: String },
    /// viem rejects these too, so falling back surfaces its `InvalidAddressError`.
    #[error("invalid address: {msg}")]
    InvalidAddress { msg: String },
    /// Mirrors viem's `AbiEncodingBytesSizeMismatchError`.
    #[error("expected {expected} bytes for bytes{expected}, got {actual}")]
    BytesSizeMismatch { expected: u32, actual: u32 },
    /// viem's `encodeNumber` throws for these, so falling back surfaces that
    /// rather than calldata built from a value the parameter cannot hold.
    #[error("{value} does not fit {ty}")]
    IntegerOutOfRange { value: String, ty: String },
}

/// ABI counts always fit a `u32`, which is what the generated bindings read.
fn abi_count(count: usize) -> u32 {
    u32::try_from(count).unwrap_or(u32::MAX)
}

fn arity_mismatch(what: &str, expected: usize, actual: usize) -> AbiError {
    AbiError::ArityMismatch {
        what: what.to_string(),
        expected: abi_count(expected),
        actual: abi_count(actual),
    }
}

fn find_function<'a>(abi: &'a JsonAbi, name: &str) -> Result<&'a Function, AbiError> {
    let not_found = || AbiError::FunctionNotFound {
        name: name.to_string(),
    };

    match abi.function(name).ok_or_else(not_found)?.as_slice() {
        [] => Err(not_found()),
        [func] => Ok(func),
        overloads => Err(AbiError::AmbiguousOverload {
            name: name.to_string(),
            count: abi_count(overloads.len()),
        }),
    }
}

/// Mirrors viem's `decodeFunctionResult`, returning viem's shape as JSON: a
/// single output unwrapped, a fully named tuple as an object and any other tuple
/// as an array, addresses checksummed, bytes as `0x` hex, no outputs as `null`.
///
/// Integers past `JS_SAFE_INT_BITS` cannot survive JSON, so they come back as
/// `{"$bigint":"<decimal>"}` for the JS `richJson` parser to rebuild.
///
/// # Errors
/// An unparseable ABI, an unknown or overloaded name, data that is not a single
/// lower-case `0x` hex string, or data that does not decode against the outputs.
#[uniffi::export]
pub fn decode_function_result(
    abi_json: String,
    function_name: String,
    data_hex: String,
) -> Result<String, AbiError> {
    let abi: JsonAbi =
        serde_json::from_str(&abi_json).map_err(|e| AbiError::InvalidAbi { msg: e.to_string() })?;

    let func = find_function(&abi, &function_name)?;

    let data = decode_viem_hex(&data_hex)?;

    let values = func
        .abi_decode_output(&data)
        .map_err(|e| AbiError::DecodeFailed { msg: e.to_string() })?;

    // Unreachable while alloy decodes one value per output, and what makes the
    // indexing below safe.
    if values.len() != func.outputs.len() {
        return Err(arity_mismatch(
            "decoded outputs",
            func.outputs.len(),
            values.len(),
        ));
    }

    let json = match func.outputs.len() {
        0 => Value::Null,
        1 => value_to_json(&func.outputs[0], &values[0])?,
        _ => Value::Array(
            func.outputs
                .iter()
                .zip(values.iter())
                .map(|(param, value)| value_to_json(param, value))
                .collect::<Result<Vec<_>, _>>()?,
        ),
    };

    serde_json::to_string(&json).map_err(|e| AbiError::DecodeFailed { msg: e.to_string() })
}

fn bigint_tag(decimal: String) -> Value {
    let mut obj = Map::new();
    obj.insert(BIGINT_TAG.to_string(), Value::String(decimal));
    Value::Object(obj)
}

/// Takes the value already rendered in base 10, which keeps this identical for
/// signed and unsigned.
fn int_to_json(decimal: String, size: usize) -> Result<Value, AbiError> {
    if size > JS_SAFE_INT_BITS {
        return Ok(bigint_tag(decimal));
    }

    // Reachable: nothing range-checks a decoded word against its declared width,
    // so a non-canonical `uint48` can hold far more than 48 bits. Failing hands
    // the call to viem instead of truncating.
    let number = decimal.parse::<i64>().map_err(|e| AbiError::DecodeFailed {
        msg: format!("{decimal} does not fit the declared {size}-bit width: {e}"),
    })?;

    Ok(Value::Number(number.into()))
}

/// `param` carries the names that key tuple fields. Its `components` describe a
/// tuple's fields, or the fields of each element in an array of tuples.
fn value_to_json(param: &Param, value: &DynSolValue) -> Result<Value, AbiError> {
    match value {
        DynSolValue::Uint(u, size) => int_to_json(u.to_string(), *size),
        DynSolValue::Int(i, size) => int_to_json(i.to_string(), *size),
        DynSolValue::Bool(b) => Ok(Value::Bool(*b)),
        DynSolValue::Address(a) => Ok(Value::String(a.to_checksum(None))),
        DynSolValue::Bytes(b) => Ok(Value::String(hex::encode_prefixed(b))),
        DynSolValue::FixedBytes(word, size) => {
            Ok(Value::String(hex::encode_prefixed(&word[..*size])))
        }
        DynSolValue::String(s) => Ok(Value::String(s.clone())),
        // Elements reuse the same `param`; the value says whether each is a tuple.
        DynSolValue::Array(items) | DynSolValue::FixedArray(items) => Ok(Value::Array(
            items
                .iter()
                .map(|item| value_to_json(param, item))
                .collect::<Result<Vec<_>, _>>()?,
        )),
        DynSolValue::Tuple(fields) => tuple_to_json(&param.components, fields),
        // Named, not a wildcard, so a new alloy variant breaks the build here.
        other @ DynSolValue::Function(_) => Err(AbiError::UnsupportedType {
            ty: format!("{other:?}"),
        }),
    }
}

fn tuple_to_json(components: &[Param], fields: &[DynSolValue]) -> Result<Value, AbiError> {
    if components.len() != fields.len() {
        return Err(arity_mismatch(
            "tuple fields",
            components.len(),
            fields.len(),
        ));
    }

    // viem keys by name only when every component has one.
    let all_named = !components.is_empty() && components.iter().all(|c| !c.name.is_empty());

    if all_named {
        let mut obj = Map::new();
        for (component, field) in components.iter().zip(fields.iter()) {
            obj.insert(component.name.clone(), value_to_json(component, field)?);
        }

        return Ok(Value::Object(obj));
    }

    Ok(Value::Array(
        components
            .iter()
            .zip(fields.iter())
            .map(|(component, field)| value_to_json(component, field))
            .collect::<Result<Vec<_>, _>>()?,
    ))
}

/// Mirrors viem's `encodeFunctionData`, returning the `0x` calldata. `args_json`
/// holds the arguments in ABI order, integers as JSON numbers, decimal strings or
/// the `{"$bigint":"<decimal>"}` tag the JS `richJson` serializer produces.
///
/// # Errors
/// An unparseable ABI, an unknown or overloaded name, or any argument viem would
/// not encode to the same bytes.
#[uniffi::export]
pub fn encode_function_data(
    abi_json: String,
    function_name: String,
    args_json: String,
) -> Result<String, AbiError> {
    let abi: JsonAbi =
        serde_json::from_str(&abi_json).map_err(|e| AbiError::InvalidAbi { msg: e.to_string() })?;

    let func = find_function(&abi, &function_name)?;

    let args: Value = serde_json::from_str(&args_json)
        .map_err(|e| AbiError::InvalidArgument { msg: e.to_string() })?;
    let args = args.as_array().ok_or_else(|| AbiError::InvalidArgument {
        msg: "args must be a JSON array".to_string(),
    })?;

    if args.len() != func.inputs.len() {
        return Err(arity_mismatch("args", func.inputs.len(), args.len()));
    }

    let values = func
        .inputs
        .iter()
        .zip(args.iter())
        .map(|(param, value)| json_to_value(param, value))
        .collect::<Result<Vec<_>, _>>()?;

    let calldata = func
        .abi_encode_input(&values)
        .map_err(|e| AbiError::EncodeFailed { msg: e.to_string() })?;

    Ok(hex::encode_prefixed(calldata))
}

/// `uint256[]` into `("uint256", None)`, `bytes32[3]` into `("bytes32", Some(3))`,
/// None for anything that is not an array.
fn split_array_type(ty: &str) -> Option<(&str, Option<usize>)> {
    let open = ty.rfind('[')?;
    if !ty.ends_with(']') {
        return None;
    }
    let inner = &ty[open + 1..ty.len() - 1];
    let len = if inner.is_empty() {
        None
    } else {
        Some(inner.parse::<usize>().ok()?)
    };

    Some((&ty[..open], len))
}

/// Accepts the richJson `{"$bigint":"..."}` tag, a plain string or a JSON number.
///
/// Fractional and exponent-form numbers are rejected rather than truncated,
/// having already lost precision before they reach here.
fn arg_to_decimal(value: &Value) -> Result<String, AbiError> {
    if let Some(tag) = value.get(BIGINT_TAG).and_then(Value::as_str) {
        return Ok(tag.to_string());
    }
    if let Some(s) = value.as_str() {
        return Ok(s.to_string());
    }
    if let Some(number) = value.as_number() {
        if number.is_i64() || number.is_u64() {
            return Ok(number.to_string());
        }

        return Err(AbiError::InvalidArgument {
            msg: format!("{number} is not an exact integer"),
        });
    }

    Err(AbiError::InvalidArgument {
        msg: format!("expected an integer, got {value}"),
    })
}

fn arg_to_str<'a>(value: &'a Value, what: &str) -> Result<&'a str, AbiError> {
    value.as_str().ok_or_else(|| AbiError::InvalidArgument {
        msg: format!("expected a {what} string, got {value}"),
    })
}

/// Recurses through arrays and tuples, taking a tuple either as an object keyed
/// by component name or as an array in ABI order.
fn json_to_value(param: &Param, value: &Value) -> Result<DynSolValue, AbiError> {
    if let Some((base, len)) = split_array_type(&param.ty) {
        let items = value.as_array().ok_or_else(|| AbiError::InvalidArgument {
            msg: format!("expected an array for {}", param.ty),
        })?;
        if let Some(expected) = len {
            if items.len() != expected {
                return Err(arity_mismatch(
                    &format!("{} items", param.ty),
                    expected,
                    items.len(),
                ));
            }
        }

        let mut element = param.clone();
        element.ty = base.to_string();
        element.name = String::new();

        let values = items
            .iter()
            .map(|item| json_to_value(&element, item))
            .collect::<Result<Vec<_>, _>>()?;

        return Ok(if len.is_some() {
            DynSolValue::FixedArray(values)
        } else {
            DynSolValue::Array(values)
        });
    }

    if param.ty == "tuple" {
        let fields = if let Some(obj) = value.as_object() {
            param
                .components
                .iter()
                .map(|component| {
                    let field =
                        obj.get(&component.name)
                            .ok_or_else(|| AbiError::InvalidArgument {
                                msg: format!("missing tuple field: {}", component.name),
                            })?;
                    json_to_value(component, field)
                })
                .collect::<Result<Vec<_>, _>>()?
        } else if let Some(arr) = value.as_array() {
            if arr.len() != param.components.len() {
                return Err(arity_mismatch(
                    "tuple fields",
                    param.components.len(),
                    arr.len(),
                ));
            }
            param
                .components
                .iter()
                .zip(arr.iter())
                .map(|(component, field)| json_to_value(component, field))
                .collect::<Result<Vec<_>, _>>()?
        } else {
            return Err(AbiError::InvalidArgument {
                msg: "expected an object or array for a tuple".to_string(),
            });
        };

        return Ok(DynSolValue::Tuple(fields));
    }

    let ty = param.resolve().map_err(|e| AbiError::UnsupportedType {
        ty: format!("{}: {e}", param.ty),
    })?;

    coerce_scalar(&ty, value)
}

fn coerce_scalar(ty: &DynSolType, value: &Value) -> Result<DynSolValue, AbiError> {
    match ty {
        DynSolType::Bool => {
            value
                .as_bool()
                .map(DynSolValue::Bool)
                .ok_or_else(|| AbiError::InvalidArgument {
                    msg: format!("expected a bool, got {value}"),
                })
        }
        DynSolType::Uint(size) => {
            let decimal = arg_to_decimal(value)?;
            let parsed =
                U256::from_str_radix(&decimal, 10).map_err(|e| AbiError::InvalidArgument {
                    msg: format!("invalid uint {decimal}: {e}"),
                })?;
            // alloy keeps the declared width but encodes the full word without
            // checking against it, so without this the native path would build
            // calldata viem's `encodeNumber` refuses to build.
            if parsed.bit_len() > *size {
                return Err(AbiError::IntegerOutOfRange {
                    value: decimal,
                    ty: format!("uint{size}"),
                });
            }
            Ok(DynSolValue::Uint(parsed, *size))
        }
        DynSolType::Int(size) => {
            let decimal = arg_to_decimal(value)?;
            let parsed = I256::from_dec_str(&decimal).map_err(|e| AbiError::InvalidArgument {
                msg: format!("invalid int {decimal}: {e}"),
            })?;
            // `bits` counts the sign bit, so this is exactly the `intN` range.
            if parsed.bits() as usize > *size {
                return Err(AbiError::IntegerOutOfRange {
                    value: decimal,
                    ty: format!("int{size}"),
                });
            }
            Ok(DynSolValue::Int(parsed, *size))
        }
        DynSolType::Address => {
            let parsed = parse_viem_address(arg_to_str(value, "address")?)?;
            Ok(DynSolValue::Address(parsed))
        }
        DynSolType::Bytes => {
            let bytes = decode_viem_hex(arg_to_str(value, "bytes")?)?;
            Ok(DynSolValue::Bytes(bytes))
        }
        DynSolType::FixedBytes(n) => {
            let bytes = decode_viem_hex(arg_to_str(value, "bytes")?)?;
            if bytes.len() != *n {
                return Err(AbiError::BytesSizeMismatch {
                    expected: abi_count(*n),
                    actual: abi_count(bytes.len()),
                });
            }
            let mut word = B256::ZERO;
            word[..*n].copy_from_slice(&bytes);
            Ok(DynSolValue::FixedBytes(word, *n))
        }
        DynSolType::String => Ok(DynSolValue::String(
            arg_to_str(value, "string")?.to_string(),
        )),
        other => Err(AbiError::UnsupportedType {
            ty: format!("{other:?}"),
        }),
    }
}

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests;
