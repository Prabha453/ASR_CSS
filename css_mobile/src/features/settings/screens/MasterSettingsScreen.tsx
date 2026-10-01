import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@/app/navigation/types';
import { SettingsDetailLayout, SettingsGroupRow, SettingsGroupSection } from '../components';
import { MASTER_RESOURCE_VISUALS } from '../constants/settings.constants';
import { MASTER_RESOURCES } from '../constants/masterData.constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'MasterSettings'>;

export function MasterSettingsScreen({ navigation }: Props) {
  return (
    <SettingsDetailLayout title="Master Data" onBack={() => navigation.goBack()}>
      <SettingsGroupSection title="LOOKUP TABLES">
        {MASTER_RESOURCES.map((resource, index) => {
          const visual = MASTER_RESOURCE_VISUALS[resource.id] ?? {
            icon: 'ellipse-outline' as const,
            iconToken: 'masterData' as const,
          };

          return (
            <SettingsGroupRow
              key={resource.id}
              title={resource.title}
              description={resource.fields.map((field) => field.label).join(' · ')}
              icon={visual.icon}
              iconToken={visual.iconToken}
              showDivider={index < MASTER_RESOURCES.length - 1}
              onPress={() =>
                navigation.navigate('MasterDataList', {
                  resourceId: resource.id,
                  title: resource.title,
                })
              }
            />
          );
        })}
      </SettingsGroupSection>
    </SettingsDetailLayout>
  );
}
