export const standardFlooringOptions = [
  {
    id: 'black',
    label: 'Black',
    texturePath: '/textures/carpet/Black_carpet.jpg',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    texturePath: '/textures/carpet/Crimson_Carpet.jpg',
  },
  {
    id: 'eclipse',
    label: 'Eclipse',
    texturePath: '/textures/carpet/Eclipse_Carpet.jpg',
  },
  {
    id: 'electrical-blue',
    label: 'Electrical Blue',
    texturePath: '/textures/carpet/Electrical_Blue_Carpet.jpg',
  },
  {
    id: 'silver-dollar',
    label: 'Silver Dollar',
    texturePath: '/textures/carpet/Silver_Dollar_Capret.jpg',
  },
  {
    id: 'teal',
    label: 'Teal',
    texturePath: '/textures/carpet/Teal_Carpet.jpg',
  },
  {
    id: 'tuxedo',
    label: 'Tuxedo',
    texturePath: '/textures/carpet/Tuxedo_Carpet.jpg',
  },
]

export const premiumFlooringOptions = [
  {
    id: 'premium-blueberry',
    label: 'Blueberry Carpet',
    texturePath: '/textures/carpet/Premium_Blueberry_Carpet.jpg',
  },
  {
    id: 'premium-burgundy',
    label: 'Burgundy Carpet',
    texturePath: '/textures/carpet/Premium_Burgundy_Carpet.jpg',
  },
  {
    id: 'premium-dark-purple',
    label: 'Dark Purple Carpet',
    texturePath: '/textures/carpet/Premium_Dark_Purple_Carpet.jpg',
  },
  {
    id: 'premium-emerald',
    label: 'Emerald Carpet',
    texturePath: '/textures/carpet/Premium_Emerald_Carpet.jpg',
  },
  {
    id: 'premium-paprika',
    label: 'Paprika Carpet',
    texturePath: '/textures/carpet/Premium_Paprika_Carpet.jpg',
  },
  {
    id: 'premium-pure-white',
    label: 'Pure White Carpet',
    texturePath: '/textures/carpet/Premium_Pure_White_Carpet.jpg',
  },
  {
    id: 'premium-sand',
    label: 'Sand Carpet',
    texturePath: '/textures/carpet/Premium_Sand_Carpet.jpg',
  },
  {
    id: 'premium-wintergreen',
    label: 'Wintergreen Carpet',
    texturePath: '/textures/carpet/Premium_Wintergreen_Carpet.jpg',
  },
]

export const vinylFlooringOptions = [
  {
    id: 'premium-walnut-flooring',
    label: 'Walnut Vinyl',
    texturePath: '/textures/carpet/Premium_Walnut_Flooring.jpg',
    textureRepeatMultiplier: 2,
    textureRotationDegrees: 90,
  },
  {
    id: 'premium-weathered-flooring',
    label: 'Weathered Vinyl',
    texturePath: '/textures/carpet/Premium_Weathered_Flooring.jpg',
    textureRepeatMultiplier: 2,
    textureRotationDegrees: 90,
  },
]

export const flooringOptions = [
  ...standardFlooringOptions,
  ...premiumFlooringOptions,
  ...vinylFlooringOptions,
]

export const flooringTexturePreloadPaths = flooringOptions
  .map((option) => option.texturePath)
  .filter(Boolean)

export const defaultFlooringId = 'silver-dollar'

export function getFlooringById(id) {
  return (
    flooringOptions.find((option) => option.id === id) ??
    flooringOptions.find((option) => option.id === defaultFlooringId) ??
    flooringOptions[0]
  )
}
