import { Directory, File, Paths } from 'expo-file-system';

const imagesDir = new Directory(Paths.document, 'medshelf-images');

// ImagePicker returns a temporary URI. Copy it to app Documents for persistence.
export async function persistMedicineImage(uri) {
  if (!uri) return null;
  if (uri.startsWith(imagesDir.uri + '/')) return uri;
  imagesDir.create({ idempotent: true, intermediates: true });
  const filename = `medicine-${Date.now()}-${Math.floor(Math.random() * 1e9)}.jpg`;
  const destination = new File(imagesDir, filename);
  await new File(uri).copy(destination);
  return destination.uri;
}

export async function removeMedicineImage(uri) {
  if (!uri || !uri.startsWith(imagesDir.uri + '/')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not clean up medicine image:', error);
  }
}
