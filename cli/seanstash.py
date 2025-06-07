#!/usr/bin/env python3
"""
SeanStash CLI - Terminal Command History Integration
Sends terminal command history to SeanStash application for intelligent snippeting.
"""

import os
import sys
import json
import argparse
import requests
import subprocess
from datetime import datetime
from pathlib import Path
import configparser
import hashlib
import re
from typing import List, Dict, Optional

class SeanStashCLI:
    def __init__(self):
        self.config_dir = Path.home() / '.seanstash'
        self.config_file = self.config_dir / 'config.ini'
        self.history_file = self.config_dir / 'sent_history.json'
        self.config_dir.mkdir(exist_ok=True)
        self.load_config()
        
    def load_config(self):
        """Load configuration from config file or create default"""
        self.config = configparser.ConfigParser()
        
        # Default configuration
        defaults = {
            'api': {
                'base_url': 'http://localhost:5000',
                'endpoint': '/api/v2/snippets',
                'timeout': '10',
                'api_key': ''
            },
            'filters': {
                'min_length': '3',
                'exclude_patterns': 'cd,ls,pwd,exit,clear,history,echo.*password,.*secret.*,.*token.*',
                'include_working_dir': 'true',
                'include_timestamp': 'true'
            },
            'behavior': {
                'auto_send': 'false',
                'batch_size': '10',
                'dry_run': 'false'
            }
        }
        
        if self.config_file.exists():
            self.config.read(self.config_file)
        else:
            self.config.update(defaults)
            self.save_config()
            
    def save_config(self):
        """Save current configuration to file"""
        with open(self.config_file, 'w') as f:
            self.config.write(f)
            
    def get_shell_history(self, limit: int = 100) -> List[str]:
        """Get recent shell history from bash/zsh history files"""
        history_commands = []
        
        # Try different history file locations (prioritize zsh)
        history_files = [
            Path.home() / '.zsh_history',
            Path.home() / '.bash_history',
            Path.home() / '.history'
        ]
        
        for hist_file in history_files:
            if hist_file.exists():
                try:
                    with open(hist_file, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        # Get last N lines, parse based on format
                        recent_lines = []
                        for line in lines[-limit:]:
                            clean_line = line.strip()
                            if clean_line:
                                # Handle zsh history format: ": timestamp:duration;command"
                                if clean_line.startswith(': ') and ';' in clean_line:
                                    command = clean_line.split(';', 1)[1]
                                    recent_lines.append(command)
                                else:
                                    # Handle bash/plain format
                                    recent_lines.append(clean_line)
                        history_commands.extend(recent_lines)
                        break
                except Exception as e:
                    print(f"Warning: Could not read {hist_file}: {e}")
                    
        return history_commands[-limit:] if history_commands else []
    
    def get_current_session_history(self) -> List[str]:
        """Get current session history using 'history' command"""
        try:
            # Get history from current session
            result = subprocess.run(['bash', '-c', 'history'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                # Parse history output (remove line numbers)
                commands = []
                for line in lines:
                    # Remove leading numbers and whitespace
                    match = re.match(r'\s*\d+\s+(.*)', line)
                    if match:
                        commands.append(match.group(1))
                return commands
        except Exception as e:
            print(f"Warning: Could not get session history: {e}")
            
        return []
    
    def get_specific_history_commands(self, history_spec: str) -> List[str]:
        """Get specific commands from history using !number or !start-end syntax"""
        try:
            # Remove the ! prefix
            spec = history_spec.lstrip('!')
            
            # Parse zsh history file with offset correction to match interactive history
            try:
                zsh_history_file = Path.home() / '.zsh_history'
                
                if not zsh_history_file.exists():
                    print("Error: .zsh_history file not found")
                    return []
                
                # Read zsh history file first to get total count
                all_commands = []
                with open(zsh_history_file, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            # Handle zsh history format: ": timestamp:duration;command"
                            if line.startswith(': ') and ';' in line:
                                # Extract command after the semicolon
                                command = line.split(';', 1)[1]
                                all_commands.append(command)
                            else:
                                # Handle other formats
                                all_commands.append(line)
                
                # With INC_APPEND_HISTORY enabled, commands are written immediately
                # No offset calculation needed - file matches interactive history
                file_total = len(all_commands)
                print(f"✓ Using direct file mapping: {file_total} commands")
                
                if not all_commands:
                    print("Error: No commands found in zsh history")
                    return []
                
                # Get last 800 commands (more recent history)
                recent_commands = all_commands[-800:]
                
                # Direct mapping - no offset needed with immediate history writing
                total_commands = len(all_commands)
                start_line = max(1, total_commands - 800 + 1)
                
                # Create history dict with direct line numbers
                history_dict = {}
                for i, command in enumerate(recent_commands):
                    line_num = start_line + i
                    history_dict[line_num] = command
                
                min_line = min(history_dict.keys()) if history_dict else 1
                max_line = max(history_dict.keys()) if history_dict else 1
                
                print(f"✓ Parsed zsh history: {len(history_dict)} recent commands (lines {min_line}-{max_line})")
                    
            except Exception as e:
                print(f"Error parsing zsh history: {e}")
                return []
            

            
            commands = []
            
            if '-' in spec:
                # Range specification: !2031-2033
                try:
                    start, end = map(int, spec.split('-'))
                    print(f"Getting commands from history lines {start} to {end}")
                    print(f"Available history lines: {min_line} to {max_line} (last 800 lines)")
                    
                    for i in range(start, end + 1):
                        if i in history_dict:
                            commands.append(history_dict[i])
                            print(f"  {i}: {history_dict[i]}")
                        else:
                            print(f"  {i}: (not found in recent history)")
                            
                except ValueError:
                    print(f"Error: Invalid range format '{spec}'. Use format: !start-end")
                    return []
            else:
                # Single number specification: !2031
                try:
                    line_num = int(spec)
                    print(f"Getting command from history line {line_num}")
                    print(f"Available history lines: {min_line} to {max_line} (last 800 lines)")
                    
                    if line_num in history_dict:
                        commands.append(history_dict[line_num])
                        print(f"  {line_num}: {history_dict[line_num]}")
                    else:
                        print(f"Error: History line {line_num} not found in recent history (showing last 800 lines: {min_line}-{max_line})")
                        return []
                        
                except ValueError:
                    print(f"Error: Invalid history number '{spec}'")
                    return []
            
            return commands
            
        except Exception as e:
            print(f"Error getting specific history commands: {e}")
            return []
    
    def filter_commands(self, commands: List[str]) -> List[Dict]:
        """Filter and process commands based on configuration"""
        filtered = []
        exclude_patterns = self.config.get('filters', 'exclude_patterns').split(',')
        min_length = self.config.getint('filters', 'min_length')
        
        for cmd in commands:
            cmd = cmd.strip()
            
            # Skip empty or too short commands
            if len(cmd) < min_length:
                continue
                
            # Skip commands matching exclude patterns
            skip = False
            for pattern in exclude_patterns:
                if re.search(pattern.strip(), cmd, re.IGNORECASE):
                    skip = True
                    break
                    
            if skip:
                continue
                
            # Create command metadata
            cmd_data = {
                'command': cmd,
                'hash': hashlib.md5(cmd.encode()).hexdigest(),
                'timestamp': datetime.now().isoformat(),
            }
            
            if self.config.getboolean('filters', 'include_working_dir'):
                cmd_data['working_dir'] = os.getcwd()
                
            filtered.append(cmd_data)
            
        return filtered
    
    def load_sent_history(self) -> set:
        """Load history of already sent command hashes"""
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    data = json.load(f)
                    return set(data.get('sent_hashes', []))
            except Exception as e:
                print(f"Warning: Could not load sent history: {e}")
        return set()
    
    def save_sent_history(self, hashes: set):
        """Save history of sent command hashes"""
        try:
            data = {
                'sent_hashes': list(hashes),
                'last_updated': datetime.now().isoformat()
            }
            with open(self.history_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save sent history: {e}")
    
    
    
    def send_commands_to_seanstash(self, commands: List[Dict]) -> bool:
        """Send commands to SeanStash API"""
        if not commands:
            print("No commands to send.")
            return True
            
        base_url = self.config.get('api', 'base_url')
        endpoint = self.config.get('api', 'endpoint')
        timeout = self.config.getint('api', 'timeout')
        api_key = self.config.get('api', 'api_key')
        
        url = f"{base_url.rstrip('/')}{endpoint}"
        
        headers = {'Content-Type': 'application/json'}
        if api_key:
            headers['x-api-key'] = api_key
        
        # Process commands for SeanStash v2 API (clean JSON format)
        snippets = []
        for cmd_data in commands:
            snippet = {
                'title': f"Terminal: {cmd_data['command'][:50]}{'...' if len(cmd_data['command']) > 50 else ''}",
                'description': f"Command executed on {cmd_data['timestamp'][:10]} in {cmd_data.get('working_dir', 'unknown directory')}",
                'categories': ['terminal-commands'],  # Array
                'isPublic': False,  # Boolean
                'locked': False,  # Boolean
                'fragments': [{
                    'file_name': 'command.sh',
                    'code': cmd_data['command'],
                    'language': 'bash',
                    'position': 0
                }]
            }
            snippets.append(snippet)
        
        # Send in batches
        batch_size = self.config.getint('behavior', 'batch_size')
        success_count = 0
        
        for i in range(0, len(snippets), batch_size):
            batch = snippets[i:i + batch_size]
            
            try:
                if self.config.getboolean('behavior', 'dry_run'):
                    print(f"[DRY RUN] Would send {len(batch)} commands to {url}")
                    for snippet in batch:
                        print(f"  - {snippet['fragments'][0]['code']}")
                    success_count += len(batch)
                else:
                    # Send each snippet individually using clean JSON
                    for snippet in batch:
                        cmd_preview = snippet['fragments'][0]['code'][:60]
                        
                        response = requests.post(url, json=snippet, headers=headers, timeout=timeout)
                        if response.status_code in [200, 201]:
                            success_count += 1
                            print(f"✓ Sent: {cmd_preview}...")
                        else:
                            print(f"✗ Failed to send: {cmd_preview}... (Status: {response.status_code})")
                            if response.status_code != 401:  # Don't spam auth errors
                                try:
                                    error_details = response.json()
                                    print(f"   Error: {error_details.get('message', 'Unknown error')}")
                                except:
                                    pass
                            
            except requests.exceptions.RequestException as e:
                print(f"Error sending batch: {e}")
                return False
        
        print(f"Successfully sent {success_count}/{len(commands)} commands to SeanStash")
        return success_count > 0
    
    def run_sync(self, limit: int = 50, force: bool = False):
        """Main sync operation - get history and send to SeanStash"""
        print(f"SeanStash CLI - Syncing terminal history...")
        print(f"Target: {self.config.get('api', 'base_url')}")
        
        # Get command history
        print("Fetching command history...")
        history_commands = self.get_shell_history(limit)
        session_commands = self.get_current_session_history()
        
        # Combine and deduplicate
        all_commands = list(dict.fromkeys(history_commands + session_commands))
        print(f"Found {len(all_commands)} total commands")
        
        # Filter commands
        filtered_commands = self.filter_commands(all_commands)
        print(f"Filtered to {len(filtered_commands)} relevant commands")
        
        if not force:
            # Remove already sent commands
            sent_hashes = self.load_sent_history()
            new_commands = [cmd for cmd in filtered_commands if cmd['hash'] not in sent_hashes]
            print(f"{len(new_commands)} new commands to send")
        else:
            new_commands = filtered_commands
            sent_hashes = set()
            print("Force mode: sending all filtered commands")
        
        if not new_commands:
            print("No new commands to sync.")
            return
            
        # Send to SeanStash
        success = self.send_commands_to_seanstash(new_commands)
        
        if success and not self.config.getboolean('behavior', 'dry_run'):
            # Update sent history
            new_hashes = {cmd['hash'] for cmd in new_commands}
            sent_hashes.update(new_hashes)
            self.save_sent_history(sent_hashes)
            print("Sync completed successfully!")
    
    def run_specific_sync(self, history_spec: str, force: bool = False):
        """Sync specific commands from history using !number or !start-end syntax"""
        print(f"SeanStash CLI - Syncing specific history commands...")
        print(f"Target: {self.config.get('api', 'base_url')}")
        print(f"History specification: {history_spec}")
        
        # Get specific commands
        specific_commands = self.get_specific_history_commands(history_spec)
        if not specific_commands:
            print("No commands found for the specified history range.")
            return
        
        # Filter commands
        filtered_commands = self.filter_commands(specific_commands)
        print(f"Filtered to {len(filtered_commands)} relevant commands")
        
        if not force:
            # Remove already sent commands
            sent_hashes = self.load_sent_history()
            new_commands = [cmd for cmd in filtered_commands if cmd['hash'] not in sent_hashes]
            print(f"{len(new_commands)} new commands to send")
        else:
            new_commands = filtered_commands
            sent_hashes = set()
            print("Force mode: sending all specified commands")
        
        if not new_commands:
            print("All specified commands have already been sent.")
            return
            
        # Send to SeanStash
        success = self.send_commands_to_seanstash(new_commands)
        
        if success and not self.config.getboolean('behavior', 'dry_run'):
            # Update sent history
            new_hashes = {cmd['hash'] for cmd in new_commands}
            sent_hashes.update(new_hashes)
            self.save_sent_history(sent_hashes)
            print("Sync completed successfully!")

    def run_command_sync(self, command_string: str, force: bool = False):
        """Send a specific command string directly to SeanStash"""
        print(f"SeanStash CLI - Sending command directly...")
        print(f"Target: {self.config.get('api', 'base_url')}")
        print(f"Command: {command_string}")
        
        # Create command data directly
        commands = [command_string]
        
        # Filter commands (this will create the proper metadata structure)
        filtered_commands = self.filter_commands(commands)
        print(f"Filtered to {len(filtered_commands)} relevant commands")
        
        if not filtered_commands:
            print("Command was filtered out (too short or matches exclusion patterns).")
            return
        
        if not force:
            # Check if already sent
            sent_hashes = self.load_sent_history()
            new_commands = [cmd for cmd in filtered_commands if cmd['hash'] not in sent_hashes]
            if len(new_commands) == 0:
                print("This command has already been sent. Use --force to resend.")
                return
        else:
            new_commands = filtered_commands
            sent_hashes = set()
            print("Force mode: sending command")
        
        # Send to SeanStash
        success = self.send_commands_to_seanstash(new_commands)
        
        if success and not self.config.getboolean('behavior', 'dry_run'):
            # Update sent history
            new_hashes = {cmd['hash'] for cmd in new_commands}
            sent_hashes.update(new_hashes)
            self.save_sent_history(sent_hashes)
            print("Command sent successfully!")
            print("💡 Background processor will enhance this with Claude AI in ~30 seconds!")
    
    def configure(self):
        """Interactive configuration setup"""
        print("SeanStash CLI Configuration")
        print("=" * 30)
        
        # API Configuration
        print("\n1. API Configuration:")
        current_url = self.config.get('api', 'base_url')
        new_url = input(f"SeanStash URL [{current_url}]: ").strip()
        if new_url:
            self.config.set('api', 'base_url', new_url)
        
        current_key = self.config.get('api', 'api_key')
        new_key = input(f"API Key (optional) [{'*' * len(current_key) if current_key else 'none'}]: ").strip()
        if new_key:
            self.config.set('api', 'api_key', new_key)
        
        # Filter Configuration
        print("\n2. Filter Configuration:")
        current_min = self.config.get('filters', 'min_length')
        new_min = input(f"Minimum command length [{current_min}]: ").strip()
        if new_min.isdigit():
            self.config.set('filters', 'min_length', new_min)
        
        # Behavior Configuration
        print("\n3. Behavior Configuration:")
        current_auto = self.config.get('behavior', 'auto_send')
        new_auto = input(f"Auto-send commands (true/false) [{current_auto}]: ").strip()
        if new_auto.lower() in ['true', 'false']:
            self.config.set('behavior', 'auto_send', new_auto.lower())
        
        self.save_config()
        print("\nConfiguration saved!")
        
    def status(self):
        """Show current status and configuration"""
        print("SeanStash CLI Status")
        print("=" * 20)
        print(f"Config file: {self.config_file}")
        print(f"History file: {self.history_file}")
        print(f"Target URL: {self.config.get('api', 'base_url')}")
        print(f"Auto-send: {self.config.get('behavior', 'auto_send')}")
        print(f"Dry run: {self.config.get('behavior', 'dry_run')}")
        
        # Test connectivity
        try:
            url = self.config.get('api', 'base_url')
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("✓ Connection to SeanStash: OK")
            else:
                print(f"⚠ Connection to SeanStash: HTTP {response.status_code} (server reachable)")
        except Exception as e:
            print(f"✗ Connection to SeanStash: Failed ({e})")
        
        # Show recent commands
        sent_hashes = self.load_sent_history()
        print(f"Commands sent: {len(sent_hashes)}")

def main():
    parser = argparse.ArgumentParser(
        description='SeanStash CLI - Terminal History Integration',
        epilog='Examples:\n'
               '  seanstash                                    # Sync recent commands\n'
               '  seanstash "kubectl get pods --all-namespaces"  # Send command directly\n'
               '  seanstash "docker ps -a"                    # Send command directly\n'
               '  seanstash !2031                              # Sync command from history line 2031\n'
               '  seanstash !2031-2033                        # Sync commands from lines 2031-2033\n'
               '  seanstash !2031 --dry-run                   # Preview what would be sent\n'
               '  seanstash sync --limit 20                   # Sync last 20 commands\n'
               '  seanstash config                            # Configure settings\n'
               '  seanstash status                            # Check status',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('command', nargs='?', default='sync',
                       help='Command to execute (sync, config, status), history specification (!number or !start-end), or command string to send directly')
    parser.add_argument('--limit', type=int, default=50, 
                       help='Number of recent commands to process (only for sync command)')
    parser.add_argument('--force', action='store_true', 
                       help='Send all commands, ignoring sent history')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be sent without actually sending')

    
    args = parser.parse_args()
    
    cli = SeanStashCLI()
    
    # Override dry-run setting if specified
    if args.dry_run:
        cli.config.set('behavior', 'dry_run', 'true')
    
    # Check if command is a history specification (starts with !)
    if args.command.startswith('!'):
        cli.run_specific_sync(args.command, force=args.force)
    elif args.command == 'sync':
        cli.run_sync(limit=args.limit, force=args.force)
    elif args.command == 'config':
        cli.configure()
    elif args.command == 'status':
        cli.status()
    else:
        # Check if it's a command string to send directly
        # If it contains spaces or special characters, treat it as a command
        if ' ' in args.command or any(char in args.command for char in ['|', '&', '>', '<', ';', '(', ')', '[', ']', '{', '}', '$', '`', '"', "'"]):
            cli.run_command_sync(args.command, force=args.force)
        else:
            print(f"Unknown command: {args.command}")
            print("Use 'seanstash --help' for usage information")
            print("\nTip: To send a command directly, use quotes:")
            print("  seanstash 'kubectl get pods --all-namespaces'")
            print("  seanstash 'docker ps -a'")
            sys.exit(1)

if __name__ == '__main__':
    main() 