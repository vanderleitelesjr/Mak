# Connect a tool to this project

Read the tool's official README first. An MCP connection can be local or hosted;
it may require a running editor, installed runtime or provider login.

For Claude, project connections live in `.mcp.json`. For Codex, use the project's
`.codex/config.toml` and the CLI's current project-trust rules. The included files
start empty. Global connections may still appear because the client already has
them configured on your computer.

Do not paste a real token into tracked configuration. Use the client's supported
environment or login mechanism. For the included fal helper, put `FAL_KEY` in
the ignored `.env` file and follow its setup reference.

The MCP panel distinguishes configured connections from a successful check.
Verify a small read-only action before assuming the agent can work in your
editor. Add a useful setup lesson to `knowledge/` after the connection works.
