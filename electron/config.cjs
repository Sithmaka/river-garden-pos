const isDev = require("electron-is-dev");
const path = require("path");

const config = {
  // Development
  dev: {
    appUrl: "https://codebell-pos-pwa.vercel.app/",
  },
  // Production - Load from Vercel
  production: {
    appUrl: "https://codebell-pos-pwa.vercel.app/",
  },
};

const environment = isDev ? config.dev : config.production;

module.exports = {
  isDev,
  appUrl: environment.appUrl,
};
