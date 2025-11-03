#!/usr/bin/env python
"""Test the schema fix."""
import sys
sys.path.append('server')

from schemas import SongSchema
import json

# Test the schema
schema = SongSchema()
test_data = {
    "title": "Test Song",
    "content_chordpro": "Test content",
    "capo": 0,
    "transpose_semitones": 0
}

try:
    result = schema.load(test_data)
    print("✅ Schema validation successful!")
    print("Result:", result)
except Exception as e:
    print("❌ Schema validation failed!")
    print("Error:", str(e))
    import traceback
    traceback.print_exc()