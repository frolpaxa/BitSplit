"""Core encode/decode logic."""

import sys

sys.set_int_max_str_digits(0)

KEY_BITS = 128  # Number of bits in the key


def encode(data: bytes) -> tuple[bytes, str]:
    """Encode bytes into a binary block and a key string.

    Args:
        data: Source file content as bytes.

    Returns:
        (block, key) where block is bytes and key is "data:count:size" string.
    """
    size = len(data)
    number = int.from_bytes(data, "big")

    bits = number.bit_length()
    if bits > KEY_BITS:
        count = bits - KEY_BITS
        key_data = number >> count
        indices = number & ((1 << count) - 1)
    else:
        count = 0
        key_data = number
        indices = 0

    if indices > 0:
        block = indices.to_bytes((indices.bit_length() + 7) // 8, "big")
    else:
        block = b""

    key = f"{key_data}:{count}:{size}"
    return block, key


def decode(block: bytes, key: str) -> bytes:
    """Decode a binary block using the key string.

    Args:
        block: Binary block (indices).
        key: Key string in "data:count:size" format.

    Returns:
        Restored file content as bytes.
    """
    parts = key.split(":")
    key_data = int(parts[0])
    count = int(parts[1])
    size = int(parts[2])

    indices = int.from_bytes(block, "big") if block else 0
    number = (key_data << count) | indices

    return number.to_bytes(size, "big")
