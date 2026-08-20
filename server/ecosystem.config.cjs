module.exports = {
  apps: [
    {
      name: "skill-registry",
      script: "dist/index.js",
      cwd: __dirname,
      // SKILLS_PATH lives in .env (gitignored) — see .env.example.
      node_args: "--env-file=.env",
      env: {
        PORT: 8787,
      },
    },
  ],
};
