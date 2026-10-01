import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';

export function useOpenDrawer() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  return () => {
    let current: NavigationProp<ParamListBase> | undefined = navigation;

    while (current) {
      if (current.getState().type === 'drawer') {
        current.dispatch(DrawerActions.openDrawer());
        return;
      }
      current = current.getParent();
    }

    navigation.dispatch(DrawerActions.openDrawer());
  };
}
