"""Standalone encode script. For CLI use: bitsplit encode"""

import sys

from bitsplit import encode

input_file = sys.argv[1]
data_output = sys.argv[2] if len(sys.argv) > 2 else "data.bin"
key_output = sys.argv[3] if len(sys.argv) > 3 else "key.txt"

with open(input_file, "rb") as f:
    raw = f.read()

block, key = encode(raw)

with open(data_output, "wb") as f:
    f.write(block)
with open(key_output, "w") as f:
    f.write(key)
