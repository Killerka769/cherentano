'use client';

import Link from 'next/link';
import { Coffee, ArrowRight, Star, Clock, Users, Award, ExternalLink } from 'lucide-react';
import styles from './CoffeePromo.module.scss';

export default function CoffeePromo() {
  return (
    <section className={styles.coffee}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.text}>
            <div className={styles.badge}>
              <Coffee size={14} />
              Наша обжарка
            </div>

            <h2 className={styles.title}>
              Кофе с характером —{' '}
              <span className={styles.highlight}>наша обжарка</span>
            </h2>

            <p className={styles.description}>
              Мы не покупаем готовый кофе. Мы создаём его сами. В ресторане Челентано 
              работает собственная кофейная обжарка — от зелёного зерна до чашки ароматного 
              напитка.
            </p>

            <p className={styles.description}>
              Каждую неделю мы обжариваем свежие зёрна 100% арабики высшего качества. 
              Это даёт нам полный контроль над вкусом, ароматом и плотностью. Мы выбираем 
              оптимальную степень прожарки для каждого сорта и следим за каждым этапом.
            </p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>☕</span>
                <div>
                  <strong>Свежая обжарка</strong>
                  <p>Зёрна обжариваются каждую неделю — только свежий кофе</p>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🌱</span>
                <div>
                  <strong>100% арабика</strong>
                  <p>Отборные зёрна высокого качества из лучших регионов</p>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🔥</span>
                <div>
                  <strong>Ручная обжарка</strong>
                  <p>Каждая партия контролируется мастером-обжарщиком</p>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🧪</span>
                <div>
                  <strong>Тестирование вкуса</strong>
                  <p>Каждая партия проходит каппинг перед подачей гостям</p>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/menu" className={styles.link}>
                <Coffee size={16} />
                Кофейное меню
                <ArrowRight size={16} />
              </Link>
              <Link href="#" className={styles.collabLink}>
                <ExternalLink size={16} />
                Коллаборация с проектом
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}