module.exports = {
  env: {
    browser: true,
    serviceworker: true,
    node: true
  },
  extends: [
    'standard-with-typescript', 'prettier'
  ],
  overrides: [
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/no-misused-promises": "off"
  }
}
