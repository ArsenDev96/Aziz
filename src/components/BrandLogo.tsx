import { Image, StyleSheet, View } from 'react-native';
import { useStrings } from '@/state/settings';
import { logo } from '@/theme/theme';

// The splash logo is the only transparent full-colour AZIZ mark; the launcher icon has the dark
// square baked in. Its artwork sits inside a square canvas with transparent padding around it,
// so the image is scaled from the visible mark's width and only the mark's own box takes layout
// space; the transparent padding hangs outside it — nothing is cropped or stretched.
const source = require('../../assets/branding/splash-logo.png');

interface Props {
  /** Width of the visible mark in dp; defaults to the home-screen size. */
  width?: number;
}

export const BrandLogo = ({ width = logo.homeWidth }: Props) => {
  const strings = useStrings();
  const side = width / logo.artwork.width;
  return (
    <View style={{ width, height: side * logo.artwork.height }}>
      <Image
        source={source}
        accessibilityRole="image"
        accessibilityLabel={strings.app.name}
        resizeMode="contain"
        style={[
          styles.image,
          {
            width: side,
            height: side,
            left: -side * logo.artwork.left,
            top: -side * logo.artwork.top,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
  },
});
