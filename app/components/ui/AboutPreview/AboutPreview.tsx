'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Coffee, Users, Award, Star, UtensilsCrossed, Flame, Shield, Clock } from 'lucide-react';
import styles from './AboutPreview.module.scss';

export default function AboutPreview() {
  return (
    <section className={styles.about}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.text}>
            <div className={styles.badge}>
              <Heart size={14} />
              О ресторане
            </div>
            <h2 className={styles.title}>
              Челентано —<br />
              <span className={styles.highlight}>место, где еда</span> объединяет людей
            </h2>

            <div className={styles.intro}>
              <p className={styles.description}>
                Ресторан Челентано — это пространство, где переплетаются традиции народов Кавказа 
                и европейская кухня. Где каждый гость чувствует себя желанным, а каждое блюдо 
                рассказывает свою историю. Мы создаём атмосферу, в которой хочется возвращаться снова и снова.
              </p>
            </div>

            <div className={styles.storyBlock}>
              <h3 className={styles.storyTitle}>Наша философия</h3>
              <p className={styles.description}>
                Название ресторана — в честь человека по имени Челентано. Он всегда был душой компании, 
                ценил честность, прозрачность и настоящее гостеприимство. Мы продолжаем его дело: 
                <strong> всё прозрачно</strong> — от выбора продуктов до подачи блюд. 
                Мы не скрываем рецепты, не экономим на качестве и не забываем, ради чего мы здесь.
              </p>
              <p className={styles.description}>
                Наша команда — это не просто повара, официанты и управляющие. Мы — одна семья, 
                которая каждый день делает всё, чтобы гость чувствовал заботу и внимание. 
                Мы гордимся тем, что создаём не просто еду, а впечатления и воспоминания.
              </p>
            </div>

            <div className={styles.principles}>
              <h3 className={styles.principlesTitle}>Три принципа Челентано</h3>
              <div className={styles.principlesGrid}>
                <div className={styles.principle}>
                  <span className={styles.principleIcon}>🔥</span>
                  <div>
                    <strong>Прозрачность</strong>
                    <p>Мы открыто говорим о том, что и как готовим. Все ингредиенты — свежие и проверенные.</p>
                  </div>
                </div>
                <div className={styles.principle}>
                  <span className={styles.principleIcon}>❤️</span>
                  <div>
                    <strong>Душевность</strong>
                    <p>Каждое блюдо готовится с вниманием и теплом, как для самых близких людей.</p>
                  </div>
                </div>
                <div className={styles.principle}>
                  <span className={styles.principleIcon}>🌟</span>
                  <div>
                    <strong>Качество</strong>
                    <p>Мы не идём на компромиссы. Вкус, подача, атмосфера — всё на высоком уровне.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.cuisineBlock}>
              <h3 className={styles.cuisineTitle}>Наша кухня</h3>
              <p className={styles.description}>
                В меню — авторское прочтение этнических блюд народов Кавказа и европейской классики. 
                От хинкали, чуду и курзе до стейков и пасты. От домашнего хлеба до десертов, 
                которые запоминаются. Мы готовим так, чтобы каждый гость нашёл своё любимое блюдо.
              </p>
              <div className={styles.cuisineTags}>
                <span>🥟 Хинкали</span>
                <span>🥘 Чуду</span>
                <span>🍖 Шашлык</span>
                <span>🥩 Стейки</span>
                <span>🍝 Паста</span>
                <span>☕ Кофе</span>
              </div>
            </div>

            <div className={styles.teamBlock}>
              <h3 className={styles.teamTitle}>Наша команда</h3>
              <p className={styles.description}>
                За каждым блюдом — профессионалы, которые любят своё дело. Наши повара — 
                хранители традиций и одновременно творцы новых вкусов. Официанты — те, кто 
                создаёт настроение и заботу. Мы работаем для вас и ради вас.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}