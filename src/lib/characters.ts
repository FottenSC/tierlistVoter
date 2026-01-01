import type { Character } from './types'

// Initial stats for new characters
const INITIAL_RATING = 1500
const INITIAL_RD = 350
const INITIAL_VOL = 0.06

// Helper to create initial character state
const createChar = (id: number, name: string, image: string, circleImage: string, flippable: boolean): Character => ({
  id,
  name,
  image,
  circleImage,
  rating: INITIAL_RATING,
  rd: INITIAL_RD,
  vol: INITIAL_VOL,
  flippable
})

export const characters: Array<Character> = [
  createChar(1, '2B', '2B.png', '2B-0.png', true),
  createChar(2, 'Amy', 'Amy.png', 'amy-1.png', true),
  createChar(3, 'Astaroth', 'Astaroth.png', 'astaroth-2.png', true),
  createChar(4, 'Azwel', 'Azwel.png', 'azwel-3.png', true),
  createChar(5, 'Cassandra', 'Cassandra.png', 'cassandra-4.png', true),
  createChar(6, 'Cervantes', 'Cervantes.png', 'cervantes-5.png', true),
  createChar(7, 'Taki', 'Taki.png', 'taki-21.png', true) ,
  createChar(8, 'Talim', 'Talim.png', 'talim-22.png', true),
  createChar(9, 'Geralt', 'Geralt.png', 'geralt-6.png', true),
  createChar(10, 'Groh', 'Groh.png', 'groh-7.png', true),
  createChar(11, 'Haohmaru', 'Haohmaru.png', 'haohmaru-8.png', true),
  createChar(12, 'Hilde', 'Hilde.png', 'hilde-9.png', true),
  createChar(13, 'Hwang', 'Hwang.png', 'hwang-10.png', true),
  createChar(14, 'Ivy', 'Ivy.png', 'ivy-11.png', true),
  createChar(15, 'Kilik', 'Kilik.png', 'kilik-12.png', true),
  createChar(16, 'Maxi', 'Maxi.png', 'maxi-13.png', true),
  createChar(17, 'Mitsurugi', 'Mitsurugi.png', 'mitsurugi-14.png', false),
  createChar(18, 'Nightmare', 'Nightmare.png', 'nightmare-15.png', false),
  createChar(19, 'Raphael', 'Raphael.png', 'raphael-16.png', true),
  createChar(20, 'Seong Mina', 'SeongMina.png', 'seong_mina-17.png', true),
  createChar(21, 'Setsuka', 'Setsuka.png', 'setsuka-18.png', true),
  createChar(22, 'Siegfried', 'Siegfried.png', 'siegfried-19.png', false),
  createChar(23, 'Sophitia', 'Sophitia.png', 'sophitia-20.png', false),
  createChar(24, 'Tira', 'Tira.png', 'tira-23.png', false),
  createChar(25, 'Voldo', 'Voldo.png', 'voldo-24.png', true),
  createChar(26, 'Xianghua', 'Xianghua.png', 'xianghua-25.png', true),
  createChar(27, 'Yoshimitsu', 'Yoshimitsu.png', 'yoshimitsu-26.png', true),
  createChar(28, 'Zasalamel', 'Zasalamel.png', 'zasalamel-27.png', true),
]
