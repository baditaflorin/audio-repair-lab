.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge hooks-post-checkout data

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## wire local git hooks
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## run frontend dev server
	npm run dev

build: ## build GitHub Pages site into docs/
	npm run build

data: ## no-op for Mode A
	@echo "Mode A has no static data generation pipeline."

test: ## run unit tests
	npm run test

test-integration: ## no integration suite in Mode A v1
	@echo "No integration tests for Mode A v1."

smoke: ## build and run Playwright smoke test
	npm run smoke

lint: ## run linters and typecheck
	npm run lint
	npm run fmt:check
	npm run typecheck

fmt: ## autoformat
	npm run fmt

pages-preview: ## serve docs/ locally as Pages
	npm run pages-preview

release: ## tag v0.1.0 after checks
	make lint test build smoke
	git tag v0.1.0

clean: ## remove transient build/test outputs
	rm -rf node_modules coverage playwright-report test-results .vite

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	.githooks/pre-push

hooks-post-merge:
	.githooks/post-merge

hooks-post-checkout:
	.githooks/post-checkout
