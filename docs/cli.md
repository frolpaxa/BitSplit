# CLI reference

After installing with `pip install bitsplit`, the `bitsplit` command is available.

## `bitsplit encode`

Split a file into a binary block and a key.

```bash
bitsplit encode <input_file> [-d DATA] [-k KEY]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `input` | *(required)* | Source file path |
| `-d`, `--data` | `data.bin` | Output block file path |
| `-k`, `--key` | `key.txt` | Output key file path |

### Examples

```bash
# Default output files
bitsplit encode photo.jpg
# → data.bin (1,105,407 bytes)
# → key.txt  (one line)

# Custom output paths
bitsplit encode photo.jpg -d photo.dat -k photo.key

# Encode to a specific directory
bitsplit encode report.pdf -d /vault/report.dat -k ~/keys/report.key
```

## `bitsplit decode`

Restore a file from a block and a key.

```bash
bitsplit decode <output_file> [-d DATA] [-k KEY]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `output` | *(required)* | Restored file path |
| `-d`, `--data` | `data.bin` | Input block file path |
| `-k`, `--key` | `key.txt` | Input key file path |

### Examples

```bash
# Default input files
bitsplit decode restored.jpg

# Custom input paths
bitsplit decode restored.jpg -d photo.dat -k photo.key
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (file not found, invalid key, etc.) |
