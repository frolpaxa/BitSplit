"""Standalone decode script. For CLI use: bitsplit decode"""

import sys

from bitsplit import decode

output_file = sys.argv[1]
data_input = sys.argv[2] if len(sys.argv) > 2 else "data.bin"
key_input = sys.argv[3] if len(sys.argv) > 3 else "key.txt"

with open(key_input, "r") as f:
    key = f.read()
with open(data_input, "rb") as f:
    block = f.read()

content = decode(block, key)

with open(output_file, "wb") as fw:
    fw.write(content)
