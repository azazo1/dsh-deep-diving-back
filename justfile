# 列出可用的 recipe.
[private]
default:
    @just --list

# 安装项目依赖.
install:
    pnpm install

# 执行 TypeScript 类型检查, 不生成文件.
typecheck:
    pnpm run typecheck

# 构建 Host ESM bundle.
build-host:
    pnpm run build:host

# 构建 Web Client CJS bundle.
build-client:
    pnpm run build:client

# 构建全部 Host 和 Client bundle.
build: build-host build-client

# 执行项目测试套件, 需要先完成构建 (bundle 注册用例读 lib/client.js).
test:
    pnpm run test

# 校验 client bundle 的 loader 注册与产物内容.
# 示例: just verify-bundle
verify-bundle:
    pnpm exec vitest run tests/bundle-registration.spec.ts

# 检查类型, 完整构建, 测试与打包内容.
verify:
    just typecheck
    just build
    just test
    pnpm pack --dry-run

# 清除中间产物与构建产物.
clean:
    rm -rf lib/
    rm -rf .tmp/
    rm -rf node_modules/
