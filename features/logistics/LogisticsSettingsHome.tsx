"use client";

import Link from "next/link";
import styles from "./logistics-settings.module.css";

export default function LogisticsSettingsHome() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span>Настройки</span>
          <h1>Управление системой</h1>
          <p>Основные действия собраны в одном месте. Сложный конструктор вынесен отдельно.</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.icon}>01</div>
            <div>
              <h2>Учётная запись</h2>
              <p>Смена личного пароля и безопасный выход из системы.</p>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("logistics:open-password"))}
            >
              Сменить пароль
            </button>
          </article>

          <article className={styles.card}>
            <div className={styles.icon}>02</div>
            <div>
              <h2>Документы и бланки</h2>
              <p>Версии официальных шаблонов, правила комплекта и сформированные документы.</p>
            </div>
            <Link href="/logistics/documents">Открыть документы</Link>
          </article>

          <article className={styles.card}>
            <div className={styles.icon}>03</div>
            <div>
              <h2>Контроль выпуска</h2>
              <p>Медицинские, технические и документальные проверки перед выездом.</p>
            </div>
            <Link href="/logistics/release">Открыть выпуск</Link>
          </article>

          <article className={`${styles.card} ${styles.advanced}`}>
            <div className={styles.icon}>04</div>
            <div>
              <h2>Конструктор системы</h2>
              <p>Структура, формы, статусы, согласования, уведомления, нумерация и роли.</p>
              <small>Раздел для системного администратора. Обычная работа с заявками здесь не требуется.</small>
            </div>
            <Link href="/logistics/admin/constructor">Открыть конструктор</Link>
          </article>
        </div>

        <aside className={styles.note}>
          <b>Что изменено в навигации</b>
          <p>Рабочие операции находятся в верхнем меню. Настройки больше не смешиваются с заявками и рейсами.</p>
        </aside>
      </section>
    </main>
  );
}
