# Refactor AI Agent

Локальный AI-agent помогает проверять архитектуру проекта перед изменениями и ревьюить текущий diff после правок. Он не является частью сайта и не меняет код автоматически.

## Что Делает

- Собирает безопасный контекст проекта.
- Запускает локальный архитектурный аудит.
- Запускает проверку здоровья проекта.
- Может анализировать конкретный файл через `--target`.
- Может находить строки импортов и использований выбранного файла.
- Может включать текущий `git diff` для ревью.
- В режиме review прикладывает новые untracked-файлы отдельным блоком, потому что `git diff` их не показывает.
- Сохраняет отчет в `tmp/refactor-ai-agent-report.md`.

## Что Не Делает

- Не редактирует файлы автоматически.
- Не коммитит и не пушит.
- Не отправляет `.env.local` в prompt.
- Не трогает MySQL, Supabase или production-данные.
- Не заменяет проверки `npm run verify`.

## Настройка

Локально добавь ключ в `.env.local`:

```text
OPENAI_API_KEY=your_key_here
OPENAI_REFACTOR_MODEL=gpt-5.4
# Optional compatibility fallback still accepted by scripts/refactor-ai-agent.mjs
OPENAI_MODEL=gpt-5.4
OPENAI_REFACTOR_MAX_OUTPUT_TOKENS=5000
```

`.env.local` нельзя коммитить.

## Режимы

### Общий аудит

```powershell
npm run refactor:ai -- --mode audit --task "Проверить архитектуру ПТО"
```

Использовать, когда нужно понять следующую безопасную точку улучшения.

### План по конкретному файлу

```powershell
npm run refactor:ai -- --mode plan --target features/pto/PtoDateTableContainer.tsx --task "Подготовить безопасный рефакторинг таблицы ПТО"
```

Использовать до изменений. Агент покажет связи файла, риски и порядок маленьких шагов.

### Review текущих изменений

```powershell
npm run refactor:ai -- --mode review --include-diff --task "Проверить текущий diff перед коммитом"
```

Использовать после изменений, до коммита. Агент проверит diff, архитектурный дрейф и пропущенные проверки.

### Локальный режим без OpenAI

```powershell
npm run refactor:ai -- --offline --mode plan --target lib/domain/pto/date-table.ts
```

Использовать для проверки, какой контекст будет отправлен агенту.

## Полезные Опции

- `--mode audit|plan|review` - тип отчета.
- `--target <path>` - сфокусировать анализ на одном файле.
- `--include-usages` - добавить строки использований target-файла. Включено по умолчанию.
- `--no-usages` - отключить поиск использований.
- `--include-diff` - добавить текущий diff. Автоматически включается в режиме `review`.
- `--no-diff` - не добавлять diff.
- `--output <path>` - сохранить отчет в другой файл.
- `--output <path>` - сохранить отчет в другой файл внутри репозитория.
- `--model <name>` - указать модель вручную.
- `--offline` - собрать отчет без вызова OpenAI.

## Рабочий Процесс

1. Перед крупным изменением:

```powershell
npm run refactor:ai -- --mode plan --target path/to/file.tsx --task "Что нужно сделать"
```

2. Реализовать маленький безопасный шаг.

3. Проверить текущий diff:

```powershell
npm run refactor:ai -- --mode review --include-diff
```

4. Запустить проектные проверки:

```powershell
npm run verify
```

5. Коммитить только проверенные изменения.

## Типовые Ошибки

### OpenAI API 429

Ключ рабочий, но закончилась квота или лимит оплаты. Проверь Billing/Usage в OpenAI. Пока квоты нет, используй:

```powershell
npm run refactor:ai -- --offline
```

### OPENAI_API_KEY is missing

Ключ не найден в `.env.local` или переменных окружения. Проверь файл локально. Не отправляй ключ в чат.

### Модель недоступна

По умолчанию используется `gpt-5.4`. Если в конкретном ключе эта модель недоступна, укажи доступную модель явно:

```powershell
npm run refactor:ai -- --model gpt-5.2 --mode audit
```

## Важное Ограничение

Агент является помощником для анализа. Финальное решение, изменения кода, проверки, коммит и деплой остаются в обычном процессе проекта по `AGENTS.md`, `ARCHITECTURE.md` и `CODE_REVIEW.md`.
