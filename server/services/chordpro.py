"""ChordPro format parsing and validation service."""
import re
from typing import Dict, Optional, List, Tuple


class ChordProService:
    """Service for handling ChordPro format operations."""

    # Regular expressions for ChordPro parsing
    CHORD_REGEX = re.compile(r'\[([^\]]+)\]')
    DIRECTIVE_REGEX = re.compile(r'\{([^:}]+)(?::([^}]*))?\}')
    CHORD_LINE_REGEX = re.compile(r'^(\s*\[[^\]]+\]\s*)+$')

    # Supported ChordPro directives
    SUPPORTED_DIRECTIVES = {
        'title', 't',
        'subtitle', 'st',
        'artist', 'a',
        'capo',
        'key',
        'tempo',
        'time',
        'comment', 'c',
        'comment_italic', 'ci',
        'comment_box', 'cb',
        'chorus', 'soc', 'start_of_chorus',
        'end_of_chorus', 'eoc',
        'verse', 'sov', 'start_of_verse',
        'end_of_verse', 'eov',
        'bridge', 'sob', 'start_of_bridge',
        'end_of_bridge', 'eob',
        'tab', 'sot', 'start_of_tab',
        'end_of_tab', 'eot',
        'grid', 'g',
        'new_song', 'ns',
        'no_grid', 'ng',
        'new_page', 'np',
        'new_physical_page', 'npp',
        'column_break', 'cb',
        'columns', 'col',
        'column', 'col'
    }

    @classmethod
    def validate(cls, content: str) -> Tuple[bool, Optional[str]]:
        """
        Validate ChordPro content.

        Args:
            content: ChordPro formatted string

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not content or not content.strip():
            return False, "Content cannot be empty"

        lines = content.split('\n')
        open_blocks = []

        for line_num, line in enumerate(lines, 1):
            # Check for directives
            directives = cls.DIRECTIVE_REGEX.findall(line)
            for directive, _ in directives:
                # Handle block directives
                if directive in ['soc', 'start_of_chorus', 'chorus']:
                    open_blocks.append('chorus')
                elif directive in ['eoc', 'end_of_chorus']:
                    if not open_blocks or open_blocks[-1] != 'chorus':
                        return False, f"Line {line_num}: Unexpected end_of_chorus"
                    open_blocks.pop()
                elif directive in ['sov', 'start_of_verse', 'verse']:
                    open_blocks.append('verse')
                elif directive in ['eov', 'end_of_verse']:
                    if not open_blocks or open_blocks[-1] != 'verse':
                        return False, f"Line {line_num}: Unexpected end_of_verse"
                    open_blocks.pop()
                elif directive in ['sob', 'start_of_bridge', 'bridge']:
                    open_blocks.append('bridge')
                elif directive in ['eob', 'end_of_bridge']:
                    if not open_blocks or open_blocks[-1] != 'bridge':
                        return False, f"Line {line_num}: Unexpected end_of_bridge"
                    open_blocks.pop()
                elif directive in ['sot', 'start_of_tab', 'tab']:
                    open_blocks.append('tab')
                elif directive in ['eot', 'end_of_tab']:
                    if not open_blocks or open_blocks[-1] != 'tab':
                        return False, f"Line {line_num}: Unexpected end_of_tab"
                    open_blocks.pop()

            # Check for unmatched brackets in chords
            chord_count_open = line.count('[')
            chord_count_close = line.count(']')
            if chord_count_open != chord_count_close:
                return False, f"Line {line_num}: Unmatched brackets in chords"

        # Check for unclosed blocks
        if open_blocks:
            return False, f"Unclosed block(s): {', '.join(open_blocks)}"

        return True, None

    @classmethod
    def inject_metadata(cls, content: str, title: Optional[str] = None,
                       artist: Optional[str] = None, capo: Optional[int] = None,
                       key: Optional[str] = None) -> str:
        """
        Inject or update metadata directives in ChordPro content.

        Args:
            content: Original ChordPro content
            title: Song title
            artist: Song artist/author
            capo: Capo position
            key: Song key

        Returns:
            Updated ChordPro content with metadata
        """
        if not content:
            content = ""

        lines = content.split('\n')
        metadata_lines = []
        content_lines = []
        metadata_found = {
            'title': False,
            'artist': False,
            'capo': False,
            'key': False
        }

        # Parse existing content and separate metadata from content
        for line in lines:
            directives = cls.DIRECTIVE_REGEX.findall(line)
            is_metadata = False

            for directive, value in directives:
                if directive in ['title', 't']:
                    metadata_found['title'] = True
                    if title:
                        line = f"{{title:{title}}}"
                    is_metadata = True
                elif directive in ['artist', 'a']:
                    metadata_found['artist'] = True
                    if artist:
                        line = f"{{artist:{artist}}}"
                    is_metadata = True
                elif directive == 'capo':
                    metadata_found['capo'] = True
                    if capo is not None:
                        line = f"{{capo:{capo}}}"
                    is_metadata = True
                elif directive == 'key':
                    metadata_found['key'] = True
                    if key:
                        line = f"{{key:{key}}}"
                    is_metadata = True

            if is_metadata:
                metadata_lines.append(line)
            else:
                content_lines.append(line)

        # Add missing metadata at the beginning
        new_metadata = []
        if title and not metadata_found['title']:
            new_metadata.append(f"{{title:{title}}}")
        if artist and not metadata_found['artist']:
            new_metadata.append(f"{{artist:{artist}}}")
        if capo is not None and not metadata_found['capo']:
            new_metadata.append(f"{{capo:{capo}}}")
        if key and not metadata_found['key']:
            new_metadata.append(f"{{key:{key}}}")

        # Combine all parts
        result = []
        if new_metadata:
            result.extend(new_metadata)
        if metadata_lines:
            result.extend(metadata_lines)
        # Add empty line between metadata and content if both exist and content has text
        if result and content_lines and len(content_lines) > 0 and any(line.strip() for line in content_lines):
            result.append('')
        result.extend(content_lines)

        return '\n'.join(result)

    @classmethod
    def extract_metadata(cls, content: str) -> Dict[str, Optional[str]]:
        """
        Extract metadata from ChordPro content.

        Args:
            content: ChordPro formatted string

        Returns:
            Dictionary with metadata fields
        """
        metadata = {
            'title': None,
            'artist': None,
            'capo': None,
            'key': None,
            'tempo': None,
            'time': None
        }

        directives = cls.DIRECTIVE_REGEX.findall(content)
        for directive, value in directives:
            if directive in ['title', 't']:
                metadata['title'] = value or ''
            elif directive in ['artist', 'a']:
                metadata['artist'] = value or ''
            elif directive == 'capo':
                try:
                    metadata['capo'] = int(value) if value else 0
                except ValueError:
                    metadata['capo'] = 0
            elif directive == 'key':
                metadata['key'] = value or ''
            elif directive == 'tempo':
                metadata['tempo'] = value or ''
            elif directive == 'time':
                metadata['time'] = value or ''

        return metadata

    @classmethod
    def parse_line(cls, line: str) -> List[Dict[str, any]]:
        """
        Parse a single line of ChordPro content.

        Args:
            line: Single line of ChordPro text

        Returns:
            List of parsed segments with chords and lyrics
        """
        segments = []
        last_end = 0

        # Find all chords in the line
        for match in cls.CHORD_REGEX.finditer(line):
            start, end = match.span()

            # Add text before the chord (if any)
            if start > last_end:
                text = line[last_end:start]
                if text:
                    segments.append({
                        'type': 'text',
                        'content': text
                    })

            # Add the chord
            segments.append({
                'type': 'chord',
                'content': match.group(1)
            })

            last_end = end

        # Add remaining text after the last chord
        if last_end < len(line):
            text = line[last_end:]
            if text:
                segments.append({
                    'type': 'text',
                    'content': text
                })

        return segments

    @classmethod
    def clean_content(cls, content: str) -> str:
        """
        Clean and normalize ChordPro content.

        Args:
            content: Raw ChordPro content

        Returns:
            Cleaned and normalized content
        """
        # Remove carriage returns
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove trailing whitespace from each line
        lines = [line.rstrip() for line in content.split('\n')]

        # Remove excessive empty lines (max 2 consecutive)
        cleaned_lines = []
        empty_count = 0
        for line in lines:
            if not line:
                empty_count += 1
                if empty_count <= 2:
                    cleaned_lines.append(line)
            else:
                empty_count = 0
                cleaned_lines.append(line)

        # Remove trailing empty lines
        while cleaned_lines and not cleaned_lines[-1]:
            cleaned_lines.pop()

        return '\n'.join(cleaned_lines)