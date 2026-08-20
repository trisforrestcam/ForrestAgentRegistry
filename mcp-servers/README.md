# MCP servers directory

Danh mục các MCP server (bên ngoài, không phải bản thân `server/` — cái đó tự nó *là*
1 MCP server chạy skills registry). Đây là nơi đăng ký các MCP server khác bạn muốn dùng
lại sau này, để `GET /api/mcp-servers` liệt kê được.

Sửa `registry.json`, mỗi entry theo schema:

```json
{
  "name": "ten-mcp-server",
  "description": "Server này dùng để làm gì",
  "transport": "http",           // "http" | "sse" | "stdio"
  "url": "https://.../mcp",      // bắt buộc nếu transport là http/sse
  "command": "npx -y foo-mcp",   // bắt buộc nếu transport là stdio
  "docs": "https://..."          // optional, link tài liệu/README của server đó
}
```

Hiện tại rỗng — chưa có MCP server nào đăng ký.
