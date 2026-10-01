import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { changeSidebarVisibility } from '../slices/thunks';

const useCollapseSidebar = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const windowSize = document.documentElement.clientWidth;
    const html       = document.documentElement;
    const hamburger  = document.querySelector('.hamburger-icon');

    // ── Collapse on mount ──────────────────────────────────────
    dispatch(changeSidebarVisibility('show'));

    if (windowSize > 767 && hamburger) {
      // Only open (collapse) if not already open
      if (!hamburger.classList.contains('open')) {
        hamburger.classList.add('open');
      }
    }

    if (windowSize < 1025 && windowSize > 767) {
      html.setAttribute('data-sidebar-size', 'sm');
    } else if (windowSize > 1025) {
      // Collapse lg → sm
      if (html.getAttribute('data-sidebar-size') !== 'sm') {
        html.setAttribute('data-sidebar-size', 'sm');
      }
    }

    // ── Restore on unmount ─────────────────────────────────────
    return () => {
      dispatch(changeSidebarVisibility('show'));

      if (windowSize > 767 && hamburger) {
        // Remove open class to restore hamburger icon
        hamburger.classList.remove('open');
      }

      if (windowSize < 1025 && windowSize > 767) {
        html.setAttribute('data-sidebar-size', '');
      } else if (windowSize > 1025) {
        // Restore sm → lg
        html.setAttribute('data-sidebar-size', 'lg');
      }
    };
  }, [dispatch]);
};

export default useCollapseSidebar;