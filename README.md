# ForrestAgentRegistry

Backend REST + MCP gateway phục vụ Skills, để Claude Code / OpenCode add vào bằng đúng 1
câu lệnh. Nội dung skill thật sự nằm ở repo riêng —
[CamkSkillV2](https://github.com/trisforrestcam/CamkSkillV2) — repo này chỉ đọc + phục vụ
lại, không chứa skill nào.

```
registry/
  mcp-servers/       # danh mục MCP server ngoài (registry.json), hiện đang rỗng
  server/            # backend: REST API + MCP gateway
```

## Chạy server (VPS + pm2)

```bash
cd server
npm install
npm run build
cp .env.example .env   # sửa SKILLS_PATH trỏ đúng nơi đã git clone CamkSkillV2 trên VPS
pm2 start ecosystem.config.cjs
pm2 save        # để pm2 tự khởi động lại sau khi VPS reboot
```

`SKILLS_PATH` trong `.env` (gitignored) là đường dẫn tới checkout của repo skills
(`CamkSkillV2`) — vd `/home/deploy/CamkSkillV2`. Server đọc live từ đây mỗi request, không
cache, nên chỉ cần `git pull` ở thư mục đó (xem CI/CD trong repo CamkSkillV2) là skill mới
xuất hiện ngay, không cần restart server này.

Mặc định lắng nghe ở `http://localhost:8787` (đổi qua biến env `PORT`). Đặt Nginx/Caddy
reverse proxy trỏ domain vào port này (khuyến nghị HTTPS) để có URL public ổn định.

Mở `https://<domain>/` bằng trình duyệt sẽ thấy trang chính: hướng dẫn cài đặt (tab **Cài
đặt**) + danh sách skill có thể tìm kiếm (tab **Skills**). Mỗi skill có link "Xem trên
GitHub" trỏ thẳng sang repo CamkSkillV2 để đọc full nội dung (thay vì tự làm viewer riêng),
và link tải zip.

Thêm/sửa/xoá skill làm trực tiếp trong repo `CamkSkillV2` (xem README ở đó), không phải ở
repo này.

## Add vào Claude Code / OpenCode — 1 câu lệnh

Thay `https://<domain>` bằng domain thật của VPS.

**Claude Code:**
```bash
claude mcp add --transport http skill-registry https://<domain>/mcp   # thêm
claude mcp remove skill-registry                                      # xoá
```

**OpenCode:**
```bash
opencode mcp add skill-registry --url https://<domain>/mcp   # thêm
```
OpenCode CLI chưa có lệnh xoá — gỡ thủ công bằng cách mở
`~/.config/opencode/opencode.json` (global) hoặc `opencode.json` ở root project, xoá entry
`"skill-registry"` trong mục `mcp`.

### Agent tự gọi (tools) — model quyết định khi nào dùng

- `list_skills` — liệt kê tất cả skill (name + description).
- `get_skill(name)` — nội dung đầy đủ SKILL.md + danh sách file khác skill đó có.
- `read_skill_file(name, path)` — đọc 1 file cụ thể (`references/*.md`, `scripts/*`, ...).

### User tự gọi (prompt) — chỉ nạp vào context khi bạn chủ động chạy

Có 1 MCP **prompt** duy nhất tên `use_skill`, nhận tham số `name` — xuất hiện dưới dạng
slash-command `/mcp__skill-registry__use_skill` trong Claude Code/OpenCode. Không phải tải
cả danh sách để chọn — nên dù registry có bao nhiêu skill, `prompts/list` vẫn chỉ có đúng
1 entry, không phình to theo số lượng skill.

Không cần gõ đúng tên đầy đủ: server tự resolve theo substring, gõ `onlive` là tự nạp
`onlive-id-login` miễn là chỉ có 1 skill khớp (nhiều client còn tự gợi ý tên khi gõ, nhưng
kể cả gõ tay trực tiếp không qua gợi ý cũng vẫn chạy đúng). Gõ trùng vào nhiều skill cùng
lúc thì server báo cần gõ cụ thể hơn thay vì tự đoán. Xem "Quy tắc đặt tên skill" trong
repo CamkSkillV2 để tên skill luôn resolve rõ ràng.

Khác với tool, prompt **không bao giờ bị agent tự ý gọi** — chỉ nạp SKILL.md vào context
của đúng session đó khi bạn chọn xong tên skill và Enter, tránh việc agent tự quyết định
inject skill không cần thiết.

## Tích hợp qua REST API (không cần MCP client)

| Endpoint | Mô tả |
|---|---|
| `GET /api/skills` | Liệt kê tất cả skill (name, description, dir) |
| `GET /api/skills/:name` | Chi tiết 1 skill, kèm danh sách file + nội dung SKILL.md |
| `GET /api/skills/:name/files/*` | Đọc nội dung 1 file cụ thể trong skill |
| `GET /api/skills/:name/download` | Tải zip toàn bộ thư mục skill |

```bash
curl https://<domain>/api/skills
curl -o oauth2-pkce-server.zip https://<domain>/api/skills/oauth2-pkce-server/download
```

## Đăng ký MCP server ngoài

`mcp-servers/registry.json` — nơi liệt kê các MCP server khác (không phải server này) mà
bạn muốn dùng lại sau này. Xem `mcp-servers/README.md` để biết schema. Hiện đang rỗng, để
sau khi có MCP server thật cần đăng ký.

## Xem log

Dùng [pino](https://getpino.io/) (qua `pino-http`), in ra stdout dạng đẹp/có màu (pino-pretty).

```bash
pm2 logs skill-registry           # tail trực tiếp
pm2 logs skill-registry --lines 100 --nostream   # xem 100 dòng gần nhất, không tail
```

Mỗi request tới `/mcp` log 2 dòng: `mcp:request` (JSON-RPC method + tên tool/prompt được
gọi) và 1 dòng riêng theo từng tool/prompt (`tool:list_skills`, `tool:get_skill`,
`tool:read_skill_file`, `prompt:use_skill`) kèm outcome (`loaded`/`not_found`/`ambiguous`/
`error`) — đủ để biết ai đang gọi skill nào, có tìm thấy không.

Đổi độ chi tiết qua env `LOG_LEVEL` (`debug`, `info` mặc định, `warn`, `error`).
