const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

module.exports = [
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**', '*.js']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module'
      }
    },
    plugins: {
      '@angular-eslint': angular,
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...tseslint.configs.recommended[2].rules,
      ...angular.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-standalone': 'off'
    }
  },
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser
    },
    plugins: {
      '@angular-eslint/template': angularTemplate
    },
    rules: {
      ...angularTemplate.configs.recommended.rules
    }
  }
];
