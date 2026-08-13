use std::str::FromStr;

use alloy_dyn_abi::{DynSolType, DynSolValue, FunctionExt, JsonAbiExt, Specifier};
use alloy_json_abi::{JsonAbi, Param};
use alloy_primitives::{hex, keccak256 as alloy_keccak256, Address, I256, U256};
use serde_json::{Map, Value};

/// keccak256 of the given bytes. Returns the 32-byte hash.
/// The JS shim handles hex encoding on either side of this call.
#[uniffi::export]
pub fn keccak256(input: Vec<u8>) -> Vec<u8> {
    alloy_keccak256(&input).to_vec()
}

/// Removes exactly one `0x` or `0X` prefix, or None when there is no prefix.
///
/// `trim_start_matches` is deliberately avoided: it strips a repeated prefix, so
/// `0x0x12` would decode rather than fail.
fn strip_hex_prefix(value: &str) -> Option<&str> {
    value.strip_prefix("0x").or_else(|| value.strip_prefix("0X"))
}

/// Lowercase `0x`-prefixed hex for the given bytes, as ethers' `hexlify` and
/// viem's `bytesToHex` produce it. Empty input gives `0x`.
///
/// Worth the FFI hop only for large buffers. The caller keeps a byte-count
/// threshold and stays in JS below it, because the fixed per-call marshalling
/// cost dwarfs the hex loop for the 20-32 byte values that dominate.
#[uniffi::export]
pub fn bytes_to_hex(input: Vec<u8>) -> String {
    hex::encode_prefixed(input)
}

/// Bytes of a `0x`-prefixed hex string, accepting exactly what ethers'
/// `getBytes` accepts: whole bytes only, either case, prefix required.
///
/// Errors on anything else, including an odd number of hex digits and a missing
/// prefix, which lets the caller fall back to the JS implementation rather than
/// this changing what an invalid input does.
#[uniffi::export]
pub fn hex_to_bytes(input: String) -> Result<Vec<u8>, AbiError> {
    let body = strip_hex_prefix(&input).ok_or_else(|| AbiError::InvalidHex {
        msg: "missing 0x prefix".to_string(),
    })?;

    // `hex::decode` strips a `0x` prefix of its own, so `0x0x1234` would decode
    // to `0x1234` here instead of failing the way ethers' regex fails it. No
    // valid body can start with a prefix anyway, since `x` is not a hex digit.
    if strip_hex_prefix(body).is_some() {
        return Err(AbiError::InvalidHex {
            msg: "repeated 0x prefix".to_string(),
        });
    }

    hex::decode(body).map_err(|e| AbiError::InvalidHex { msg: e.to_string() })
}

/// EIP-55 checksummed form of a 20-byte hex address, as viem's
/// `checksumAddress` produces it. Errors on anything that is not a
/// `0x`-prefixed 40-character hex string, which lets the caller fall back to
/// viem rather than this changing what an invalid input does.
///
/// Only the plain EIP-55 form is handled here. viem also supports the EIP-1191
/// chain-id variant, which the caller keeps in JS so there is no second
/// implementation of it to keep in sync.
#[uniffi::export]
pub fn checksum_address(address: String) -> Result<String, AbiError> {
    let parsed = Address::from_str(&address).map_err(|e| AbiError::InvalidHex {
        msg: format!("{address}: {e}"),
    })?;

    Ok(parsed.to_checksum(None))
}

/// viem returns a plain JS number for integers this wide or narrower and a
/// BigInt for anything wider. See `decodeNumber` in viem's
/// `utils/abi/decodeAbiParameters.js`.
const JS_SAFE_INT_BITS: usize = 48;

#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum AbiError {
    #[error("invalid abi json: {msg}")]
    InvalidAbi { msg: String },
    #[error("function not found in abi: {name}")]
    FunctionNotFound { name: String },
    /// Picking between overloads needs the call's arguments, which this API does
    /// not take. The caller is expected to fall back to viem.
    #[error("{name} is overloaded {count} ways and cannot be resolved by name alone")]
    AmbiguousOverload { name: String, count: u32 },
    #[error("invalid hex: {msg}")]
    InvalidHex { msg: String },
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
}

fn arity_mismatch(what: &str, expected: usize, actual: usize) -> AbiError {
    AbiError::ArityMismatch {
        what: what.to_string(),
        expected: expected as u32,
        actual: actual as u32,
    }
}

/// Looks up a function by name, refusing overloaded names because only the
/// call's arguments can disambiguate those.
fn find_function<'a>(abi: &'a JsonAbi, name: &str) -> Result<&'a alloy_json_abi::Function, AbiError> {
    let overloads = abi
        .function(name)
        .ok_or_else(|| AbiError::FunctionNotFound {
            name: name.to_string(),
        })?;

    if overloads.len() > 1 {
        return Err(AbiError::AmbiguousOverload {
            name: name.to_string(),
            count: overloads.len() as u32,
        });
    }

    overloads.first().ok_or_else(|| AbiError::FunctionNotFound {
        name: name.to_string(),
    })
}

/// Decodes the return data of a contract function, mirroring viem's
/// `decodeFunctionResult`. Returns a JSON string whose shape matches viem:
/// a single output is unwrapped, named tuples become objects, unnamed ones
/// become arrays, addresses are EIP-55 checksummed, bytes are `0x`-hex.
///
/// Integers wider than `JS_SAFE_INT_BITS` cannot survive JSON, so those leaves
/// are emitted as the tagged object `{"$bigint":"<decimal>"}` — the exact
/// convention the JS `richJson` parser reconstructs into a real BigInt. Narrower
/// integers become plain JSON numbers, because that is what viem returns.
///
/// A function with no outputs decodes to JSON `null`, which the JS side turns
/// back into the `undefined` viem returns.
#[uniffi::export]
pub fn decode_function_result(
    abi_json: String,
    function_name: String,
    data_hex: String,
) -> Result<String, AbiError> {
    let abi: JsonAbi = serde_json::from_str(&abi_json)
        .map_err(|e| AbiError::InvalidAbi { msg: e.to_string() })?;

    let func = find_function(&abi, &function_name)?;

    let data = hex::decode(data_hex.trim_start_matches("0x"))
        .map_err(|e| AbiError::InvalidHex { msg: e.to_string() })?;

    let values = func
        .abi_decode_output(&data)
        .map_err(|e| AbiError::DecodeFailed { msg: e.to_string() })?;

    if values.len() != func.outputs.len() {
        return Err(arity_mismatch(
            "decoded outputs",
            func.outputs.len(),
            values.len(),
        ));
    }

    // viem returns undefined for no outputs, unwraps a single output, and gives
    // an array for more than one.
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
    obj.insert("$bigint".to_string(), Value::String(decimal));
    Value::Object(obj)
}

/// Emits an integer the way viem does: a plain JSON number up to
/// `JS_SAFE_INT_BITS`, a `$bigint` tag beyond it. `decimal` is the value already
/// rendered in base 10, which keeps this identical for signed and unsigned.
fn int_to_json(decimal: String, size: usize) -> Result<Value, AbiError> {
    if size > JS_SAFE_INT_BITS {
        return Ok(bigint_tag(decimal));
    }

    // Anything this narrow fits an i64, signed or not.
    let number = decimal
        .parse::<i64>()
        .map_err(|e| AbiError::DecodeFailed { msg: format!("int{size} {decimal}: {e}") })?;

    Ok(Value::Number(number.into()))
}

/// Recursively converts a decoded value into viem-shaped JSON. `param` carries
/// the ABI names used to key tuple fields; its `components` describe the fields
/// of a tuple (and, for an array of tuples, the fields of each element).
fn value_to_json(param: &Param, value: &DynSolValue) -> Result<Value, AbiError> {
    match value {
        DynSolValue::Uint(u, size) => int_to_json(u.to_string(), *size),
        DynSolValue::Int(i, size) => int_to_json(i.to_string(), *size),
        DynSolValue::Bool(b) => Ok(Value::Bool(*b)),
        DynSolValue::Address(a) => Ok(Value::String(a.to_checksum(None))),
        DynSolValue::Bytes(b) => Ok(Value::String(format!("0x{}", hex::encode(b)))),
        DynSolValue::FixedBytes(word, size) => {
            Ok(Value::String(format!("0x{}", hex::encode(&word[..*size]))))
        }
        DynSolValue::String(s) => Ok(Value::String(s.clone())),
        // The element type of an array reuses the same `param`; the value itself
        // tells us whether each element is a tuple (needs names) or a scalar.
        DynSolValue::Array(items) | DynSolValue::FixedArray(items) => Ok(Value::Array(
            items
                .iter()
                .map(|item| value_to_json(param, item))
                .collect::<Result<Vec<_>, _>>()?,
        )),
        DynSolValue::Tuple(fields) => tuple_to_json(&param.components, fields),
        other => Err(AbiError::UnsupportedType {
            ty: format!("{other:?}"),
        }),
    }
}

fn tuple_to_json(components: &[Param], fields: &[DynSolValue]) -> Result<Value, AbiError> {
    if components.len() != fields.len() {
        return Err(arity_mismatch("tuple fields", components.len(), fields.len()));
    }

    // viem keys a tuple by name only when every component is named, and falls
    // back to a positional array otherwise.
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

/// Encodes a contract function call, mirroring viem's `encodeFunctionData`.
/// `args_json` is a JSON array of the arguments in ABI order; integers may be
/// plain JSON numbers/strings or the `{"$bigint":"<decimal>"}` tag that the JS
/// `richJson` serializer produces. Returns the `0x` calldata (4-byte selector
/// followed by the ABI-encoded arguments).
#[uniffi::export]
pub fn encode_function_data(
    abi_json: String,
    function_name: String,
    args_json: String,
) -> Result<String, AbiError> {
    let abi: JsonAbi = serde_json::from_str(&abi_json)
        .map_err(|e| AbiError::InvalidAbi { msg: e.to_string() })?;

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

    Ok(format!("0x{}", hex::encode(calldata)))
}

/// Splits an array type into its element type and length, e.g. `uint256[]` into
/// `("uint256", None)` and `bytes32[3]` into `("bytes32", Some(3))`. Returns
/// None for non-array types.
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

/// Reads an integer argument as a decimal string, accepting the richJson
/// `{"$bigint":"..."}` tag, a plain string, or a JSON number.
///
/// A fractional or exponent-form JSON number is rejected rather than truncated.
/// JS numbers that large have already lost precision by the time they reach
/// here, so the caller is better off falling back to viem.
fn arg_to_decimal(value: &Value) -> Result<String, AbiError> {
    if let Some(tag) = value.get("$bigint").and_then(Value::as_str) {
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

/// Coerces a JSON argument into a DynSolValue according to its ABI param,
/// recursing through arrays and tuples (objects keyed by component name, or
/// arrays in ABI order).
fn json_to_value(param: &Param, value: &Value) -> Result<DynSolValue, AbiError> {
    if let Some((base, len)) = split_array_type(&param.ty) {
        let items = value.as_array().ok_or_else(|| AbiError::InvalidArgument {
            msg: format!("expected an array for {}", param.ty),
        })?;
        if let Some(expected) = len {
            if items.len() != expected {
                return Err(arity_mismatch(&format!("{} items", param.ty), expected, items.len()));
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
                        obj.get(&component.name).ok_or_else(|| AbiError::InvalidArgument {
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
        DynSolType::Bool => value
            .as_bool()
            .map(DynSolValue::Bool)
            .ok_or_else(|| AbiError::InvalidArgument {
                msg: format!("expected a bool, got {value}"),
            }),
        DynSolType::Uint(size) => {
            let decimal = arg_to_decimal(value)?;
            let parsed =
                U256::from_str_radix(&decimal, 10).map_err(|e| AbiError::InvalidArgument {
                    msg: format!("invalid uint {decimal}: {e}"),
                })?;
            Ok(DynSolValue::Uint(parsed, *size))
        }
        DynSolType::Int(size) => {
            let decimal = arg_to_decimal(value)?;
            let parsed = I256::from_dec_str(&decimal).map_err(|e| AbiError::InvalidArgument {
                msg: format!("invalid int {decimal}: {e}"),
            })?;
            Ok(DynSolValue::Int(parsed, *size))
        }
        DynSolType::Address => {
            let parsed =
                Address::from_str(arg_to_str(value, "address")?).map_err(|e| {
                    AbiError::InvalidArgument {
                        msg: format!("invalid address: {e}"),
                    }
                })?;
            Ok(DynSolValue::Address(parsed))
        }
        DynSolType::Bytes => {
            let bytes = hex::decode(arg_to_str(value, "bytes")?.trim_start_matches("0x"))
                .map_err(|e| AbiError::InvalidHex { msg: e.to_string() })?;
            Ok(DynSolValue::Bytes(bytes))
        }
        DynSolType::FixedBytes(n) => {
            let bytes = hex::decode(arg_to_str(value, "bytes")?.trim_start_matches("0x"))
                .map_err(|e| AbiError::InvalidHex { msg: e.to_string() })?;
            if bytes.len() != *n {
                return Err(arity_mismatch(&format!("bytes{n} bytes"), *n, bytes.len()));
            }
            let mut word = [0u8; 32];
            word[..*n].copy_from_slice(&bytes);
            Ok(DynSolValue::FixedBytes(word.into(), *n))
        }
        DynSolType::String => Ok(DynSolValue::String(arg_to_str(value, "string")?.to_string())),
        other => Err(AbiError::UnsupportedType {
            ty: format!("{other:?}"),
        }),
    }
}

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests {
    use super::*;

    const ERC20_ABI: &str = r#"[
        {"type":"function","name":"transfer","inputs":[
            {"name":"to","type":"address"},
            {"name":"amount","type":"uint256"}
        ],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"}
    ]"#;

    #[test]
    fn encodes_erc20_transfer_like_viem() {
        let calldata = encode_function_data(
            ERC20_ABI.to_string(),
            "transfer".to_string(),
            r#"["0x1111111111111111111111111111111111111111",{"$bigint":"256"}]"#.to_string(),
        )
        .unwrap();

        // selector a9059cbb, address left-padded to 32 bytes, amount 0x100
        assert_eq!(
            calldata,
            "0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111\
0000000000000000000000000000000000000000000000000000000000000100"
        );
    }

    #[test]
    fn decodes_bool_result_like_viem() {
        let json = decode_function_result(
            ERC20_ABI.to_string(),
            "transfer".to_string(),
            "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
        )
        .unwrap();

        assert_eq!(json, "true");
    }

    // The BalanceGetter.TokenInfo shape that a portfolio update decodes, reduced
    // to the two fields that pin down the int-width rule: viem gives a plain
    // number for the uint8 decimals and a BigInt for the uint256 amount.
    const TOKEN_INFO_ABI: &str = r#"[
        {"type":"function","name":"info","inputs":[],"outputs":[{"name":"","type":"tuple","components":[
            {"name":"amount","type":"uint256"},
            {"name":"decimals","type":"uint8"}
        ]}],"stateMutability":"view"}
    ]"#;

    #[test]
    fn narrow_ints_decode_as_plain_numbers_and_wide_ints_as_bigint_tags() {
        let json = decode_function_result(
            TOKEN_INFO_ABI.to_string(),
            "info".to_string(),
            "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000\
             0000000000000000000000000000000000000000000000000000000000000012"
                .replace(['\n', ' '], ""),
        )
        .unwrap();

        assert_eq!(json, r#"{"amount":{"$bigint":"1000000000000000000"},"decimals":18}"#);
    }

    // The mixed-case cases matter because viem's checksumAddress never validates
    // the checksum it is handed, it only recomputes one. A wrong-checksum input
    // must come back corrected, not rejected, or the shim would start throwing
    // where viem does not.
    #[test]
    fn checksum_address_matches_viem() {
        let expected = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

        for input in [
            "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045",
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            "0xD8da6bf26964af9d7eed9e03e53415d37aa96045",
        ] {
            assert_eq!(checksum_address(input.to_string()).unwrap(), expected);
        }

        assert_eq!(
            checksum_address("0x0000000000000000000000000000000000000000".to_string()).unwrap(),
            "0x0000000000000000000000000000000000000000"
        );
    }

    #[test]
    fn bytes_to_hex_matches_hexlify() {
        // Empty gives the bare prefix, the same as ethers' `hexlify(new Uint8Array())`.
        assert_eq!(bytes_to_hex(vec![]), "0x");
        assert_eq!(bytes_to_hex(vec![0x00]), "0x00");
        assert_eq!(bytes_to_hex(vec![0x12, 0x34]), "0x1234");
        // Every nibble above 9 must come out lowercase, which is what both
        // ethers and viem emit.
        assert_eq!(bytes_to_hex(vec![0xde, 0xad, 0xbe, 0xef]), "0xdeadbeef");
        assert_eq!(bytes_to_hex(vec![0xff; 32]), format!("0x{}", "ff".repeat(32)));
    }

    #[test]
    fn hex_to_bytes_matches_get_bytes() {
        assert_eq!(hex_to_bytes("0x".to_string()).unwrap(), Vec::<u8>::new());
        assert_eq!(hex_to_bytes("0x00".to_string()).unwrap(), vec![0x00]);
        assert_eq!(hex_to_bytes("0xdeadbeef".to_string()).unwrap(), vec![0xde, 0xad, 0xbe, 0xef]);
        // ethers' regex carries the `i` flag, so uppercase digits and an
        // uppercase `0X` prefix are both valid input.
        assert_eq!(hex_to_bytes("0xDEADBEEF".to_string()).unwrap(), vec![0xde, 0xad, 0xbe, 0xef]);
        assert_eq!(hex_to_bytes("0XdeAdBeEf".to_string()).unwrap(), vec![0xde, 0xad, 0xbe, 0xef]);
    }

    #[test]
    fn hex_to_bytes_rejects_what_ethers_rejects() {
        for input in [
            // Odd number of digits: not whole bytes.
            "0x1",
            "0xabc",
            // No prefix at all.
            "",
            "1234",
            "deadbeef",
            // Non-hex characters.
            "0xzz",
            "0x12 34",
            "0x12,34",
            // A repeated prefix must not be stripped twice.
            "0x0x1234",
        ] {
            assert!(
                hex_to_bytes(input.to_string()).is_err(),
                "expected {input:?} to be rejected so the caller falls back to JS"
            );
        }
    }

    #[test]
    fn hex_round_trips_a_deployless_sized_payload() {
        // A BalanceGetter call for a few hundred tokens encodes to roughly this
        // much, which is the size range the native path exists for.
        const PAYLOAD_BYTES: usize = 16 * 1024;

        let bytes: Vec<u8> = (0..PAYLOAD_BYTES).map(|i| (i % 256) as u8).collect();
        let hex = bytes_to_hex(bytes.clone());

        assert_eq!(hex.len(), 2 + PAYLOAD_BYTES * 2, "hex is 2 chars per byte plus the prefix");
        assert_eq!(
            hex_to_bytes(hex).unwrap(),
            bytes,
            "a {PAYLOAD_BYTES}-byte payload must survive the round trip exactly"
        );
    }

    #[test]
    fn checksum_address_rejects_what_it_cannot_parse() {
        for input in ["", "0x", "0xd8da6bf26964af9d7eed9e03e53415d37aa960", "not an address"] {
            assert!(
                checksum_address(input.to_string()).is_err(),
                "expected {input} to be rejected so the caller falls back to viem"
            );
        }
    }
}
