// import orcWarrior from '../images/orc-warrior.png'
// import penguinPaladin from '../images/penguin-paladin.png'
// import shapeshifter from '../images/shapeshifter.png'
// import slimeCharacter from '../images/slime.png'
// import sorceressCharacter from '../images/sorceress.png'
// import vitalikCharacter from '../images/vitalik.png'
import astroCat from '../images/astroCat.png'
import bearUp from '../images/bearUp.png'
import black from '../images/black.png'
import green from '../images/green.png'
import yello from '../images/yello.png'

export type Character = {
  id: number
  name: string
  description: string
  image: string
}

export const CHARACTERS: Character[] = [
  {
    id: 1,
    name: 'Sussy Baka',
    description: '',
    image: astroCat
  },
  {
    id: 2,
    name: 'Gustavo',
    description: '',
    image: bearUp
  },
  {
    id: 3,
    name: 'Beans',
    description: '',
    image: yello
  },
  {
    id: 4,
    name: 'Khidir Karawita',
    description: '',
    image: black
  },
  {
    id: 5,
    name: 'Algae',
    description: '',
    image: green
  }
]
