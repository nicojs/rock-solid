module.exports = {
  spec: ['dist/**/*.?(spec|test).js'],
  forbidOnly: Boolean(process.env.CI),
  timeout: '100000',
};
