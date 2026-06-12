"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp, List, MessageSquare, X } from "lucide-react";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

type ArticleReadingChromeProps = {
  chatHref: string;
};

export function ArticleReadingChrome({ chatHref }: ArticleReadingChromeProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  useEffect(() => {
    const readHeadings = () => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>("[data-article-content] h2[id], [data-article-content] h3[id]")
      );

      const nextItems = headings
        .map((heading) => ({
          id: heading.id,
          text: heading.textContent?.trim() || "",
          level: heading.tagName.toLowerCase() === "h3" ? 3 : 2,
        }))
        .filter((item): item is TocItem => Boolean(item.id && item.text));

      setItems(nextItems);
      setActiveId((current) => current || nextItems[0]?.id || "");
    };

    const frame = window.requestAnimationFrame(readHeadings);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const updateActiveHeading = () => {
      let nextActive = items[0]?.id || "";
      for (const item of items) {
        const element = document.getElementById(item.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 150) {
          nextActive = item.id;
        } else {
          break;
        }
      }
      setActiveId(nextActive);
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);
    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [items]);

  const hasToc = items.length > 0;

  useEffect(() => {
    const page = document.querySelector(".article-page");
    page?.classList.toggle("has-article-toc", hasToc);
    return () => page?.classList.remove("has-article-toc");
  }, [hasToc]);

  const tocList = useMemo(() => (
    <nav className="article-toc-list" aria-label="文章目录">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`article-toc-link level-${item.level} ${activeId === item.id ? "is-active" : ""}`}
          onClick={() => setIsMobileTocOpen(false)}
        >
          {item.text}
        </a>
      ))}
    </nav>
  ), [activeId, items]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="article-top-progress" aria-hidden="true">
        <motion.div className="article-top-progress-fill" style={{ scaleX: progress }} />
      </div>

      {hasToc && (
        <aside className="article-toc-panel glass-popover" aria-label="文章目录">
          <div className="article-toc-title">
            <List size={15} />
            <span>目录</span>
          </div>
          {tocList}
          <Link href={chatHref} className="article-toc-chat">
            <MessageSquare size={16} />
            对此文章提问
          </Link>
        </aside>
      )}

      {hasToc && (
        <>
          <button
            type="button"
            className="article-mobile-toc-button glass-popover"
            onClick={() => setIsMobileTocOpen(true)}
            aria-label="打开文章目录"
          >
            <List size={18} />
            目录
          </button>

          {isMobileTocOpen && (
            <div className="article-mobile-toc-overlay" role="dialog" aria-modal="true" aria-label="文章目录">
              <button
                type="button"
                className="article-mobile-toc-scrim"
                onClick={() => setIsMobileTocOpen(false)}
                aria-label="关闭文章目录"
              />
              <div className="article-mobile-toc-sheet glass-popover">
                <div className="article-mobile-toc-head">
                  <div className="article-toc-title">
                    <List size={15} />
                    <span>目录</span>
                  </div>
                  <button type="button" onClick={() => setIsMobileTocOpen(false)} aria-label="关闭目录">
                    <X size={18} />
                  </button>
                </div>
                {tocList}
                <Link href={chatHref} className="article-toc-chat">
                  <MessageSquare size={16} />
                  对此文章提问
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="article-progress-button glass-popover"
        onClick={scrollToTop}
        aria-label="回到文章顶部"
      >
        <svg className="article-progress-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle className="article-progress-button-track" cx="22" cy="22" r="18" />
          <motion.circle
            className="article-progress-button-fill"
            cx="22"
            cy="22"
            r="18"
            style={{ pathLength: progress }}
          />
        </svg>
        <ArrowUp className="article-progress-button-icon" size={20} />
      </button>
    </>
  );
}
