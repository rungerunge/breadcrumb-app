console.log("Render.com deployment verification successful!");
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log("Environment variables:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- HOST: ${process.env.HOST}`);
console.log(`- DB_PATH: ${process.env.DB_PATH}`);

// Exit successfully
process.exit(0); 