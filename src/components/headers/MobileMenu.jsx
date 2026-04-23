import React from 'react';
import { useStore } from '@nanostores/react';
import { isMenuOpen, toggleMenu, closeMenu } from '@stores/ui';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ items = [{label: 'Inicio', href: '/'}] }) {
  const $isMenuOpen = useStore(isMenuOpen);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <button 
        className={`${styles.burger} ${$isMenuOpen ? styles.active : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`${styles.overlay} ${$isMenuOpen ? styles.visible : ''}`} onClick={closeMenu} />

      <aside className={`${styles.mobileMenu} ${$isMenuOpen ? styles.open : ''}`}>
        <nav className={styles.nav}>
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={styles.itemWrapper}
              style={{ transitionDelay: `${0.1 + idx * 0.05}s` }}
            >
              <a 
                href={item.href} 
                className={styles.link}
                onClick={closeMenu}
              >
                {item.label}
              </a>
              {item.submenu && (
                <div className={styles.submenu}>
                  {item.submenu.map((sub, sIdx) => (
                    <a 
                      key={sIdx} 
                      href={sub.href} 
                      className={styles.sublink}
                      onClick={closeMenu}
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
