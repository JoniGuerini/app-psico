import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** Quando true, exibe a opção mas não pode ser selecionada (placeholder permanente). */
  disabled?: boolean;
}

export interface SelectProps<T extends string | number> {
  value: T | "";
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  id?: string;
  className?: string;
  /** Largura mínima do dropdown. Default: largura do botão. */
  menuMinWidth?: number;
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  disabled,
  invalid,
  ariaLabel,
  ariaLabelledBy,
  id,
  className,
  menuMinWidth,
}: SelectProps<T>) {
  const generatedId = useId();
  const buttonId = id ?? `select-${generatedId}`;
  const listboxId = `${buttonId}-list`;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuScrollerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(menuMinWidth);

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  // Atualiza a largura do menu sempre que abre.
  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      setMenuWidth(menuMinWidth ?? buttonRef.current.offsetWidth);
    }
  }, [open, menuMinWidth]);

  const computeInitialActive = useCallback(() => {
    if (selectedIndex >= 0 && !options[selectedIndex].disabled) {
      return selectedIndex;
    }
    return options.findIndex((o) => !o.disabled);
  }, [options, selectedIndex]);

  const openMenu = useCallback(() => {
    setActiveIndex(computeInitialActive());
    setOpen(true);
  }, [computeInitialActive]);

  const toggleMenu = useCallback(() => {
    if (open) {
      setOpen(false);
    } else {
      openMenu();
    }
  }, [open, openMenu]);

  // Click fora fecha (considera o wrapper do scroll, não só o <ul>)
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuScrollerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Faz scroll do item ativo no menu
  useEffect(() => {
    if (!open) return;
    if (activeIndex < 0) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const moveActive = useCallback(
    (dir: 1 | -1) => {
      if (options.length === 0) return;
      let i = activeIndex;
      for (let n = 0; n < options.length; n++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i].disabled) {
          setActiveIndex(i);
          return;
        }
      }
    },
    [activeIndex, options]
  );

  const commit = (index: number) => {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openMenu();
      else moveActive(e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && activeIndex >= 0) {
        commit(activeIndex);
      } else {
        toggleMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (e.key === "Tab" && open) {
      setOpen(false);
    }
  };

  return (
    <div className={"ui-select" + (open ? " open" : "") + (className ? " " + className : "")}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className={"ui-select-trigger" + (invalid ? " invalid" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => !disabled && toggleMenu()}
        onKeyDown={onButtonKey}
      >
        <span
          className={"ui-select-value" + (selectedOption ? "" : " is-placeholder")}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="ui-select-caret" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div
          ref={menuScrollerRef}
          className="ui-select-menu-wrap"
          style={menuWidth ? { minWidth: menuWidth } : undefined}
        >
          <OverlayScrollbarsComponent
            className="ui-select-menu-scroller"
            options={{
              scrollbars: {
                theme: "os-theme-warm",
                autoHide: "never",
              },
              overflow: { x: "hidden" },
            }}
            defer
          >
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              className="ui-select-menu"
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
              }
            >
              {options.map((opt, i) => {
                const isSelected = i === selectedIndex;
                const isActive = i === activeIndex;
                const cls = ["ui-select-option"];
                if (isSelected) cls.push("selected");
                if (isActive) cls.push("active");
                if (opt.disabled) cls.push("disabled");
                return (
                  <li
                    key={String(opt.value) + i}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    className={cls.join(" ")}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                    onMouseDown={(e) => {
                      // mousedown pra evitar perder o foco antes de comitar
                      e.preventDefault();
                      if (!opt.disabled) commit(i);
                    }}
                  >
                    <span className="ui-select-option-label">{opt.label}</span>
                    {isSelected && (
                      <span className="ui-select-option-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </OverlayScrollbarsComponent>
        </div>
      )}
    </div>
  );
}
