import { MaterialCommunityIcons } from '@expo/vector-icons';

type EditIconProps = {
  size?: number;
  color: string;
};

/** Thick solid pencil used for all Edit actions across the app. */
export function EditIcon({ size = 18, color }: EditIconProps) {
  return <MaterialCommunityIcons name="pencil" size={size} color={color} />;
}

export function isEditGlyph(name?: string | null) {
  return name === 'create-outline' || name === 'create' || name === 'pencil' || name === 'pencil-outline';
}
