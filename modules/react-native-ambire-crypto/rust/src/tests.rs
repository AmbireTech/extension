use super::*;

const ERC20_ABI: &str = r#"[
    {"type":"function","name":"transfer","inputs":[
        {"name":"to","type":"address"},
        {"name":"amount","type":"uint256"}
    ],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"}
]"#;

const HOLDER: &str = "0x1111111111111111111111111111111111111111";
const HOLDER_WORD: &str = "0000000000000000000000001111111111111111111111111111111111111111";
const ONE_WORD: &str = "0000000000000000000000000000000000000000000000000000000000000001";

/// Derived rather than pasted, so a test pins down the argument encoding it
/// is about and nothing else.
fn selector(signature: &str) -> String {
    hex::encode(&keccak256(signature.as_bytes().to_vec())[..4])
}

fn one_arg_abi(ty: &str) -> String {
    format!(
        r#"[{{"type":"function","name":"f","inputs":[{{"name":"x","type":"{ty}"}}],"outputs":[],"stateMutability":"nonpayable"}}]"#
    )
}

fn encode_one(ty: &str, arg_json: &str) -> Result<String, AbiError> {
    encode_function_data(one_arg_abi(ty), "f".to_string(), format!("[{arg_json}]"))
}

fn one_output_abi(ty: &str) -> String {
    format!(
        r#"[{{"type":"function","name":"g","inputs":[],"outputs":[{{"name":"","type":"{ty}"}}],"stateMutability":"view"}}]"#
    )
}

fn decode_one(ty: &str, data_hex: &str) -> Result<String, AbiError> {
    decode_function_result(one_output_abi(ty), "g".to_string(), data_hex.to_string())
}

#[test]
fn keccak256_matches_the_empty_input_vector() {
    assert_eq!(
        hex::encode(keccak256(vec![])),
        "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    );
}

#[test]
fn keccak256_matches_the_abc_vector() {
    assert_eq!(
        hex::encode(keccak256(b"abc".to_vec())),
        "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"
    );
}

#[test]
fn bytes_to_hex_gives_the_bare_prefix_for_empty_input() {
    assert_eq!(bytes_to_hex(vec![]), "0x");
}

#[test]
fn bytes_to_hex_keeps_a_leading_zero_byte() {
    assert_eq!(bytes_to_hex(vec![0x00]), "0x00");
}

#[test]
fn bytes_to_hex_lower_cases_every_nibble_above_nine() {
    assert_eq!(bytes_to_hex(vec![0xde, 0xad, 0xbe, 0xef]), "0xdeadbeef");
}

#[test]
fn bytes_to_hex_encodes_a_full_word() {
    assert_eq!(
        bytes_to_hex(vec![0xff; 32]),
        format!("0x{}", "ff".repeat(32))
    );
}

#[test]
fn hex_to_bytes_decodes_the_bare_prefix_to_no_bytes() {
    assert_eq!(hex_to_bytes("0x".to_string()).unwrap(), Vec::<u8>::new());
}

#[test]
fn hex_to_bytes_decodes_lower_case_digits() {
    assert_eq!(
        hex_to_bytes("0xdeadbeef".to_string()).unwrap(),
        vec![0xde, 0xad, 0xbe, 0xef]
    );
}

#[test]
fn hex_to_bytes_decodes_upper_case_digits() {
    assert_eq!(
        hex_to_bytes("0xDEADBEEF".to_string()).unwrap(),
        vec![0xde, 0xad, 0xbe, 0xef]
    );
}

#[test]
fn hex_to_bytes_decodes_an_upper_case_prefix() {
    // ethers' `i` flag covers the prefix too, unlike viem's regexes.
    assert_eq!(
        hex_to_bytes("0XdeAdBeEf".to_string()).unwrap(),
        vec![0xde, 0xad, 0xbe, 0xef]
    );
}

#[test]
fn hex_to_bytes_rejects_what_ethers_rejects() {
    for input in [
        // Odd number of digits: not whole bytes.
        "0x1", "0xabc", // No prefix at all.
        "", "1234", "deadbeef", // Non-hex characters.
        "0xzz", "0x12 34", "0x12,34",
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
    // Roughly a BalanceGetter call for a few hundred tokens, the size range
    // the native path exists for.
    const PAYLOAD_BYTES: usize = 16 * 1024;

    let bytes: Vec<u8> = (0..=u8::MAX).cycle().take(PAYLOAD_BYTES).collect();
    let hex = bytes_to_hex(bytes.clone());

    assert_eq!(
        hex.len(),
        2 + PAYLOAD_BYTES * 2,
        "hex is 2 chars per byte plus the prefix"
    );
    assert_eq!(
        hex_to_bytes(hex).unwrap(),
        bytes,
        "a {PAYLOAD_BYTES}-byte payload must survive the round trip exactly"
    );
}

// viem never validates the checksum it is handed, it only recomputes one, so
// a wrong-checksum input must come back corrected rather than rejected.
#[test]
fn checksum_address_recomputes_the_checksum_whatever_case_it_is_given() {
    let expected = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    for input in [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045",
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0xD8da6bf26964af9d7eed9e03e53415d37aa96045",
    ] {
        assert_eq!(checksum_address(input.to_string()).unwrap(), expected);
    }
}

#[test]
fn checksum_address_leaves_the_zero_address_alone() {
    assert_eq!(
        checksum_address("0x0000000000000000000000000000000000000000".to_string()).unwrap(),
        "0x0000000000000000000000000000000000000000"
    );
}

#[test]
fn checksum_address_rejects_what_it_cannot_parse() {
    for input in [
        "",
        "0x",
        "0xd8da6bf26964af9d7eed9e03e53415d37aa960",
        "not an address",
    ] {
        assert!(
            checksum_address(input.to_string()).is_err(),
            "expected {input} to be rejected so the caller falls back to viem"
        );
    }
}

// viem's `checksumAddress` strips the first two characters unconditionally,
// so it reads these as a different address than alloy does. Getting them
// right here would be a behaviour change rather than a speed-up.
#[test]
fn checksum_address_rejects_an_address_viem_would_not_recognise() {
    for input in [
        "d8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0Xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    ] {
        assert!(
            checksum_address(input.to_string()).is_err(),
            "expected {input} to go back to viem rather than be parsed here"
        );
    }
}

#[test]
fn decode_function_result_unwraps_a_single_output() {
    let json = decode_function_result(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        format!("0x{ONE_WORD}"),
    )
    .unwrap();

    assert_eq!(json, "true");
}

#[test]
fn decode_function_result_gives_null_for_a_function_with_no_outputs() {
    // The JS side turns this into viem's `undefined`.
    let abi = r#"[{"type":"function","name":"g","inputs":[],"outputs":[],"stateMutability":"nonpayable"}]"#;

    let json = decode_function_result(abi.to_string(), "g".to_string(), "0x".to_string()).unwrap();

    assert_eq!(json, "null");
}

#[test]
fn decode_function_result_gives_an_array_for_several_outputs() {
    let abi = r#"[{"type":"function","name":"g","inputs":[],"outputs":[
        {"name":"a","type":"bool"},
        {"name":"b","type":"uint8"}
    ],"stateMutability":"view"}]"#;

    let json = decode_function_result(
        abi.to_string(),
        "g".to_string(),
        format!("0x{ONE_WORD}{ONE_WORD}"),
    )
    .unwrap();

    assert_eq!(json, "[true,1]");
}

// The BalanceGetter.TokenInfo fields that pin down the int-width rule: viem
// gives a number for the uint8 and a BigInt for the uint256.
#[test]
fn decode_function_result_names_tuple_fields_and_tags_only_the_wide_int() {
    let abi = r#"[
        {"type":"function","name":"info","inputs":[],"outputs":[{"name":"","type":"tuple","components":[
            {"name":"amount","type":"uint256"},
            {"name":"decimals","type":"uint8"}
        ]}],"stateMutability":"view"}
    ]"#;

    let json = decode_function_result(
        abi.to_string(),
        "info".to_string(),
        "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000\
         0000000000000000000000000000000000000000000000000000000000000012"
            .replace(['\n', ' '], ""),
    )
    .unwrap();

    assert_eq!(
        json,
        r#"{"amount":{"$bigint":"1000000000000000000"},"decimals":18}"#
    );
}

// viem keys by name only when every component has one.
#[test]
fn decode_function_result_gives_an_array_for_a_partly_unnamed_tuple() {
    let abi = r#"[
        {"type":"function","name":"g","inputs":[],"outputs":[{"name":"","type":"tuple","components":[
            {"name":"named","type":"bool"},
            {"name":"","type":"bool"}
        ]}],"stateMutability":"view"}
    ]"#;

    let json = decode_function_result(
        abi.to_string(),
        "g".to_string(),
        format!("0x{ONE_WORD}{ONE_WORD}"),
    )
    .unwrap();

    assert_eq!(json, "[true,true]");
}

#[test]
fn decode_function_result_checksums_an_address_output() {
    let word = "000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045";

    assert_eq!(
        decode_one("address", &format!("0x{word}")).unwrap(),
        r#""0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045""#
    );
}

#[test]
fn decode_function_result_hex_encodes_a_dynamic_bytes_output() {
    let data = format!(
        "0x{}{}{}",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000002",
        "1234000000000000000000000000000000000000000000000000000000000000"
    );

    assert_eq!(decode_one("bytes", &data).unwrap(), r#""0x1234""#);
}

#[test]
fn decode_function_result_trims_a_fixed_bytes_output_to_its_width() {
    let word = "1234000000000000000000000000000000000000000000000000000000000000";

    assert_eq!(
        decode_one("bytes2", &format!("0x{word}")).unwrap(),
        r#""0x1234""#
    );
}

#[test]
fn decode_function_result_decodes_a_string_output() {
    let data = format!(
        "0x{}{}{}",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000003",
        "6162630000000000000000000000000000000000000000000000000000000000"
    );

    assert_eq!(decode_one("string", &data).unwrap(), r#""abc""#);
}

// Each of these decodes if the prefix is stripped with `trim_start_matches`,
// and viem reads them as different data than alloy does.
#[test]
fn decode_function_result_rejects_data_viem_would_read_differently() {
    for data in [
        ONE_WORD.to_string(),
        format!("0X{ONE_WORD}"),
        format!("0x0x{ONE_WORD}"),
    ] {
        assert!(
            decode_one("bool", &data).is_err(),
            "expected {data} to go back to viem rather than be decoded here"
        );
    }
}

// Nothing range-checks a decoded word against its declared width, so a
// contract can return a `uint48` holding far more than 48 bits. viem renders
// it as a lossy JS number, so refusing sends the call there.
#[test]
fn decode_function_result_hands_over_a_narrow_int_too_wide_for_a_js_number() {
    let mut word = [0u8; 32];
    word[32 - 9] = 0x40; // 2^70

    let error = decode_one("uint48", &hex::encode_prefixed(word)).unwrap_err();

    assert!(
        matches!(error, AbiError::DecodeFailed { .. }),
        "expected a DecodeFailed handover, got {error}"
    );
}

#[test]
fn decode_function_result_reports_an_unknown_function() {
    let error = decode_function_result(
        ERC20_ABI.to_string(),
        "nope".to_string(),
        format!("0x{ONE_WORD}"),
    )
    .unwrap_err();

    assert!(
        matches!(error, AbiError::FunctionNotFound { .. }),
        "expected FunctionNotFound, got {error}"
    );
}

// Only the arguments can pick between overloads, and this API has none.
#[test]
fn decode_function_result_refuses_to_pick_between_overloads() {
    let abi = r#"[
        {"type":"function","name":"f","inputs":[{"name":"a","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"},
        {"type":"function","name":"f","inputs":[{"name":"a","type":"address"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"}
    ]"#;

    let error = decode_function_result(abi.to_string(), "f".to_string(), format!("0x{ONE_WORD}"))
        .unwrap_err();

    assert!(
        matches!(error, AbiError::AmbiguousOverload { count: 2, .. }),
        "expected AmbiguousOverload, got {error}"
    );
}

#[test]
fn decode_function_result_reports_an_unparseable_abi() {
    let error = decode_function_result(
        "not json".to_string(),
        "transfer".to_string(),
        format!("0x{ONE_WORD}"),
    )
    .unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidAbi { .. }),
        "expected InvalidAbi, got {error}"
    );
}

#[test]
fn encode_function_data_encodes_an_erc20_transfer_like_viem() {
    let calldata = encode_function_data(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        format!(r#"["{HOLDER}",{{"$bigint":"256"}}]"#),
    )
    .unwrap();

    // Address left-padded to 32 bytes, amount 0x100.
    assert_eq!(
        calldata,
        format!(
            "0x{}{HOLDER_WORD}{}",
            selector("transfer(address,uint256)"),
            "0000000000000000000000000000000000000000000000000000000000000100"
        )
    );
}

#[test]
fn encode_function_data_accepts_an_integer_as_a_plain_json_number() {
    let calldata = encode_function_data(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        format!(r#"["{HOLDER}",256]"#),
    )
    .unwrap();

    assert!(
        calldata.ends_with("0100"),
        "expected the amount word to end in 0100, got {calldata}"
    );
}

#[test]
fn encode_function_data_accepts_an_integer_as_a_decimal_string() {
    let calldata = encode_function_data(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        format!(r#"["{HOLDER}","256"]"#),
    )
    .unwrap();

    assert!(
        calldata.ends_with("0100"),
        "expected the amount word to end in 0100, got {calldata}"
    );
}

#[test]
fn encode_function_data_encodes_a_tuple_given_as_an_object() {
    let abi = r#"[{"type":"function","name":"f","inputs":[{"name":"p","type":"tuple","components":[
        {"name":"amount","type":"uint256"},
        {"name":"to","type":"address"}
    ]}],"outputs":[],"stateMutability":"nonpayable"}]"#;

    let calldata = encode_function_data(
        abi.to_string(),
        "f".to_string(),
        format!(r#"[{{"amount":1,"to":"{HOLDER}"}}]"#),
    )
    .unwrap();

    // Inline, and in ABI order rather than the order the JSON object lists.
    assert_eq!(
        calldata,
        format!(
            "0x{}{ONE_WORD}{HOLDER_WORD}",
            selector("f((uint256,address))")
        )
    );
}

#[test]
fn encode_function_data_encodes_a_tuple_given_as_a_positional_array() {
    let abi = r#"[{"type":"function","name":"f","inputs":[{"name":"p","type":"tuple","components":[
        {"name":"amount","type":"uint256"},
        {"name":"to","type":"address"}
    ]}],"outputs":[],"stateMutability":"nonpayable"}]"#;

    let calldata = encode_function_data(
        abi.to_string(),
        "f".to_string(),
        format!(r#"[[1,"{HOLDER}"]]"#),
    )
    .unwrap();

    assert_eq!(
        calldata,
        format!(
            "0x{}{ONE_WORD}{HOLDER_WORD}",
            selector("f((uint256,address))")
        )
    );
}

#[test]
fn encode_function_data_reports_a_missing_tuple_field() {
    let abi = r#"[{"type":"function","name":"f","inputs":[{"name":"p","type":"tuple","components":[
        {"name":"amount","type":"uint256"}
    ]}],"outputs":[],"stateMutability":"nonpayable"}]"#;

    let error = encode_function_data(
        abi.to_string(),
        "f".to_string(),
        r#"[{"other":1}]"#.to_string(),
    )
    .unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_encodes_a_dynamic_array() {
    let calldata = encode_one("uint256[]", "[1,2]").unwrap();

    assert_eq!(
        calldata,
        format!(
            "0x{}{}{}{ONE_WORD}{}",
            selector("f(uint256[])"),
            "0000000000000000000000000000000000000000000000000000000000000020",
            "0000000000000000000000000000000000000000000000000000000000000002",
            "0000000000000000000000000000000000000000000000000000000000000002"
        )
    );
}

#[test]
fn encode_function_data_encodes_a_fixed_array_inline() {
    let calldata = encode_one("uint256[2]", "[1,1]").unwrap();

    assert_eq!(
        calldata,
        format!("0x{}{ONE_WORD}{ONE_WORD}", selector("f(uint256[2])"))
    );
}

#[test]
fn encode_function_data_rejects_a_fixed_array_of_the_wrong_length() {
    let error = encode_one("uint256[2]", "[1,1,1]").unwrap_err();

    assert!(
        matches!(
            error,
            AbiError::ArityMismatch {
                expected: 2,
                actual: 3,
                ..
            }
        ),
        "expected ArityMismatch, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_a_non_array_for_an_array_parameter() {
    let error = encode_one("uint256[]", "1").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

// alloy encodes the full word regardless of the declared width, so without a
// check this builds calldata viem's `encodeNumber` refuses to.
#[test]
fn encode_function_data_rejects_a_uint_wider_than_its_declared_size() {
    let error = encode_one("uint8", "256").unwrap_err();

    assert!(
        matches!(error, AbiError::IntegerOutOfRange { .. }),
        "expected IntegerOutOfRange, got {error}"
    );
}

#[test]
fn encode_function_data_accepts_the_largest_value_a_uint8_holds() {
    assert!(encode_one("uint8", "255").is_ok(), "255 fits a uint8");
}

#[test]
fn encode_function_data_rejects_an_int_above_its_declared_size() {
    let error = encode_one("int8", "128").unwrap_err();

    assert!(
        matches!(error, AbiError::IntegerOutOfRange { .. }),
        "expected IntegerOutOfRange, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_an_int_below_its_declared_size() {
    let error = encode_one("int8", "-129").unwrap_err();

    assert!(
        matches!(error, AbiError::IntegerOutOfRange { .. }),
        "expected IntegerOutOfRange, got {error}"
    );
}

#[test]
fn encode_function_data_accepts_the_bounds_of_an_int8() {
    assert!(encode_one("int8", "127").is_ok(), "127 fits an int8");
    assert!(encode_one("int8", "-128").is_ok(), "-128 fits an int8");
}

#[test]
fn encode_function_data_encodes_a_negative_int_in_twos_complement() {
    let calldata = encode_one("int256", "-1").unwrap();

    assert_eq!(
        calldata,
        format!("0x{}{}", selector("f(int256)"), "ff".repeat(32))
    );
}

#[test]
fn encode_function_data_rejects_a_negative_uint() {
    let error = encode_one("uint256", "-1").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

// These have already lost precision, so truncating would encode a value the
// caller never asked for.
#[test]
fn encode_function_data_rejects_a_fractional_number() {
    let error = encode_one("uint256", "1.5").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_an_exponent_form_number() {
    let error = encode_one("uint256", "1e30").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_a_uint_beyond_256_bits() {
    let error = encode_one("uint256", &format!(r#""{}""#, "9".repeat(80))).unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

// viem's `encodeAddress` throws unless `isAddress` matches: lower-case
// prefix, 40 digits.
#[test]
fn encode_function_data_rejects_an_address_viem_would_reject() {
    for address in [
        "1111111111111111111111111111111111111111",
        "0X1111111111111111111111111111111111111111",
        "0x11111111111111111111111111111111111111",
        "0x0x11111111111111111111111111111111111111",
    ] {
        let error = encode_one("address", &format!(r#""{address}""#)).unwrap_err();

        assert!(
            matches!(error, AbiError::InvalidAddress { .. }),
            "expected InvalidAddress for {address}, got {error}"
        );
    }
}

#[test]
fn encode_function_data_rejects_a_non_string_address() {
    let error = encode_one("address", "1").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_encodes_dynamic_bytes() {
    let calldata = encode_one("bytes", r#""0x1234""#).unwrap();

    assert_eq!(
        calldata,
        format!(
            "0x{}{}{}{}",
            selector("f(bytes)"),
            "0000000000000000000000000000000000000000000000000000000000000020",
            "0000000000000000000000000000000000000000000000000000000000000002",
            "1234000000000000000000000000000000000000000000000000000000000000"
        )
    );
}

// A repeated prefix survives `trim_start_matches`, and an unprefixed value is
// a different length to viem's `size`.
#[test]
fn encode_function_data_rejects_bytes_viem_would_read_differently() {
    for bytes in ["1234", "0X1234", "0x0x1234"] {
        let error = encode_one("bytes", &format!(r#""{bytes}""#)).unwrap_err();

        assert!(
            matches!(error, AbiError::InvalidHex { .. }),
            "expected InvalidHex for {bytes}, got {error}"
        );
    }
}

#[test]
fn encode_function_data_encodes_fixed_bytes_right_padded() {
    let calldata = encode_one("bytes2", r#""0x1234""#).unwrap();

    assert_eq!(
        calldata,
        format!(
            "0x{}{}",
            selector("f(bytes2)"),
            "1234000000000000000000000000000000000000000000000000000000000000"
        )
    );
}

#[test]
fn encode_function_data_rejects_fixed_bytes_of_the_wrong_size() {
    let error = encode_one("bytes32", r#""0x1234""#).unwrap_err();

    assert!(
        matches!(
            error,
            AbiError::BytesSizeMismatch {
                expected: 32,
                actual: 2
            }
        ),
        "expected BytesSizeMismatch, got {error}"
    );
}

#[test]
fn encode_function_data_encodes_a_string() {
    let calldata = encode_one("string", r#""abc""#).unwrap();

    assert_eq!(
        calldata,
        format!(
            "0x{}{}{}{}",
            selector("f(string)"),
            "0000000000000000000000000000000000000000000000000000000000000020",
            "0000000000000000000000000000000000000000000000000000000000000003",
            "6162630000000000000000000000000000000000000000000000000000000000"
        )
    );
}

#[test]
fn encode_function_data_encodes_a_bool() {
    let calldata = encode_one("bool", "true").unwrap();

    assert_eq!(calldata, format!("0x{}{ONE_WORD}", selector("f(bool)")));
}

#[test]
fn encode_function_data_rejects_a_non_bool_for_a_bool_parameter() {
    let error = encode_one("bool", "1").unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_too_few_args() {
    let error = encode_function_data(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        "[]".to_string(),
    )
    .unwrap_err();

    assert!(
        matches!(
            error,
            AbiError::ArityMismatch {
                expected: 2,
                actual: 0,
                ..
            }
        ),
        "expected ArityMismatch, got {error}"
    );
}

#[test]
fn encode_function_data_rejects_args_that_are_not_an_array() {
    let error = encode_function_data(
        ERC20_ABI.to_string(),
        "transfer".to_string(),
        "{}".to_string(),
    )
    .unwrap_err();

    assert!(
        matches!(error, AbiError::InvalidArgument { .. }),
        "expected InvalidArgument, got {error}"
    );
}

#[test]
fn encode_function_data_refuses_to_pick_between_overloads() {
    let abi = r#"[
        {"type":"function","name":"f","inputs":[{"name":"a","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
        {"type":"function","name":"f","inputs":[{"name":"a","type":"address"}],"outputs":[],"stateMutability":"nonpayable"}
    ]"#;

    let error =
        encode_function_data(abi.to_string(), "f".to_string(), "[1]".to_string()).unwrap_err();

    assert!(
        matches!(error, AbiError::AmbiguousOverload { count: 2, .. }),
        "expected AmbiguousOverload, got {error}"
    );
}

#[test]
fn split_array_type_reads_a_dynamic_array() {
    assert_eq!(split_array_type("uint256[]"), Some(("uint256", None)));
}

#[test]
fn split_array_type_reads_a_fixed_array() {
    assert_eq!(split_array_type("bytes32[3]"), Some(("bytes32", Some(3))));
}

// Solidity puts the outer length rightmost: three elements of `uint256[2]`.
#[test]
fn split_array_type_peels_the_outermost_dimension_first() {
    assert_eq!(
        split_array_type("uint256[2][3]"),
        Some(("uint256[2]", Some(3)))
    );
}

#[test]
fn split_array_type_ignores_a_non_array_type() {
    assert_eq!(split_array_type("uint256"), None);
}

#[test]
fn split_array_type_ignores_an_unparseable_length() {
    assert_eq!(split_array_type("uint256[abc]"), None);
}
