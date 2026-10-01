import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { ScreenShell } from './ScreenShell';

type PrimaryScreenShellProps = {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  showNotifications?: boolean;
  profileInitials?: string;
};

export function PrimaryScreenShell({
  title,
  onBack,
  rightAction,
  children,
  scrollable = true,
  showNotifications = false,
  profileInitials,
}: PrimaryScreenShellProps) {
  return (
    <ScreenShell
      scrollable={scrollable}
      header={
        <AppHeader
          title={title}
          leftAction={onBack ? 'back' : 'menu'}
          onLeftPress={onBack}
          showNotifications={showNotifications}
          showProfile={Boolean(profileInitials)}
          profileInitials={profileInitials}
          rightAction={rightAction}
        />
      }
    >
      {children}
    </ScreenShell>
  );
}
