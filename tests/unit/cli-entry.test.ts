import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'

describe('CLI Entry Point', () => {
  const cliPath = join(process.cwd(), 'dist', 'index.js')

  it('should display help when --help flag is used', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' })
    
    expect(output).toContain('Usage: llmenv')
    expect(output).toContain('.env is for secrets. .llmenv is for you.')
    expect(output).toContain('-V, --version')
    expect(output).toContain('-h, --help')
  })

  it('should display version when --version flag is used', () => {
    const output = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' })
    
    expect(output.trim()).toBe('1.0.0')
  })

  it('should have correct program name', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' })
    
    expect(output).toContain('llmenv')
  })
})
