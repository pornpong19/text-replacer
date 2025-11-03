#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import os
import argparse
from pathlib import Path

class TextReplacer:
    def __init__(self):
        self.replacements = {}
    
    def add_replacement(self, old_word, new_word):
        """Add a word replacement rule"""
        self.replacements[old_word] = new_word
    
    def set_replacements(self, replacements_dict):
        """Set all replacement rules at once"""
        self.replacements = replacements_dict
    
    def process_file(self, file_path):
        """Process a single text file with replacements"""
        try:
            # First, read file as binary to examine raw bytes
            with open(file_path, 'rb') as file:
                raw_data = file.read()

            # Try different encodings to decode the file
            encodings_to_try = [
                'utf-8', 'utf-8-sig',
                'windows-1252', 'cp1252', 'iso-8859-1',
                'windows-1251', 'cp1251',
                'cp874', 'tis-620',  # Thai encodings
                'gbk', 'gb2312',     # Chinese encodings
                'shift_jis', 'euc-jp', 'iso-2022-jp',  # Japanese encodings
                'ascii', 'latin1'
            ]

            content = None
            used_encoding = None
            best_content = None
            best_encoding = None
            min_replacement_chars = float('inf')

            # Try each encoding and find the one with least replacement characters
            for encoding in encodings_to_try:
                try:
                    decoded_content = raw_data.decode(encoding)
                    replacement_count = decoded_content.count('\ufffd')

                    if replacement_count == 0:
                        # Perfect match - no replacement characters
                        content = decoded_content
                        used_encoding = encoding
                        break
                    elif replacement_count < min_replacement_chars:
                        # Better than previous attempts
                        best_content = decoded_content
                        best_encoding = encoding
                        min_replacement_chars = replacement_count

                except (UnicodeDecodeError, UnicodeError):
                    continue

            # If no perfect match found, use the best attempt
            if content is None:
                if best_content is not None:
                    content = best_content
                    used_encoding = f"{best_encoding} (with {min_replacement_chars} replacement chars)"
                else:
                    # Last resort - use utf-8 with error handling
                    content = raw_data.decode('utf-8', errors='replace')
                    used_encoding = 'utf-8-replace-fallback'
            
            # Apply replacements
            modified_content = content
            replacements_made = []
            
            for old_word, new_word in self.replacements.items():
                # Skip replacement if old_word contains replacement characters
                if '\ufffd' in old_word:
                    continue

                if old_word in modified_content:
                    count = modified_content.count(old_word)
                    modified_content = modified_content.replace(old_word, new_word)

                    # Determine operation type for display
                    operation_type = 'delete' if new_word == '' else 'replace'

                    replacements_made.append({
                        'old': old_word,
                        'new': new_word,
                        'count': count,
                        'operation': operation_type
                    })
            
            # Create output folder and save edited file with original name
            path_obj = Path(file_path)
            output_folder = path_obj.parent / "edited_files"

            # Create output folder if it doesn't exist
            output_folder.mkdir(exist_ok=True)

            # Use original filename
            new_file_path = output_folder / path_obj.name

            # If file already exists in output folder, add number suffix
            counter = 1
            while new_file_path.exists():
                new_file_name = f"{path_obj.stem}_{counter}{path_obj.suffix}"
                new_file_path = output_folder / new_file_name
                counter += 1

            # Write to new file with UTF-8 encoding
            write_encoding = 'utf-8'
            with open(new_file_path, 'w', encoding=write_encoding) as file:
                file.write(modified_content)
            
            return {
                'success': True,
                'file': str(file_path),
                'new_file': str(new_file_path),
                'replacements': replacements_made,
                'encoding_used': used_encoding,
                'encoding_written': write_encoding
            }
            
        except Exception as e:
            return {
                'success': False,
                'file': str(file_path),
                'error': str(e)
            }
    
    def process_files(self, file_paths):
        """Process multiple text files"""
        results = []
        for file_path in file_paths:
            if os.path.exists(file_path) and file_path.endswith('.txt'):
                result = self.process_file(file_path)
                results.append(result)
            else:
                results.append({
                    'success': False,
                    'file': str(file_path),
                    'error': 'File not found or not a .txt file'
                })
        return results

def main():
    parser = argparse.ArgumentParser(description='Text file word replacer')
    parser.add_argument('--files', nargs='+', help='Text files to process')
    parser.add_argument('--replacements', type=str, help='JSON string of replacements')
    parser.add_argument('--json-input', type=str, help='JSON file with input data')
    
    args = parser.parse_args()
    
    replacer = TextReplacer()
    
    try:
        # Handle JSON input for Electron communication
        if args.json_input:
            with open(args.json_input, 'r', encoding='utf-8') as f:
                data = json.load(f)
                files = data.get('files', [])
                replacements = data.get('replacements', {})
        else:
            # Handle command line arguments
            files = args.files or []
            replacements = json.loads(args.replacements) if args.replacements else {}
        
        # Set replacement rules
        replacer.set_replacements(replacements)
        
        # Process files
        results = replacer.process_files(files)
        
        # Output results as JSON
        print(json.dumps({
            'success': True,
            'results': results
        }, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()