// ============================================================
// Papaw — Mission Seed Data & Engine
// ============================================================

import { MissionDefinition, MissionState, MissionCategory, CategoryInfo } from '@/types';

// ============================================================
// CATEGORY METADATA
// ============================================================

export const categories: Record<MissionCategory, Omit<CategoryInfo, 'missions' | 'completedCount'>> = {
  tokoh_dunia: {
    id: 'tokoh_dunia',
    title: 'Tokoh Dunia',
    icon: '🌍',
    description: 'Kenalan sama orang-orang hebat yang mengubah dunia',
    color: '#E8A87C',
  },
  peristiwa_sejarah: {
    id: 'peristiwa_sejarah',
    title: 'Peristiwa Sejarah',
    icon: '📜',
    description: 'Jelajahi momen-momen penting dalam sejarah',
    color: '#D4A574',
  },
  luar_angkasa: {
    id: 'luar_angkasa',
    title: 'Luar Angkasa',
    icon: '🚀',
    description: 'Petualangan ke bintang, planet, dan galaxy',
    color: '#7B8CDE',
  },
  hewan_alam: {
    id: 'hewan_alam',
    title: 'Hewan & Alam',
    icon: '🦁',
    description: 'Dunia hewan dan keajaiban alam',
    color: '#85C88A',
  },
  penemuan_sains: {
    id: 'penemuan_sains',
    title: 'Penemuan Sains',
    icon: '🔬',
    description: 'Penemuan-penemuan keren yang mengubah dunia',
    color: '#F6B93B',
  },
  teknologi: {
    id: 'teknologi',
    title: 'Teknologi',
    icon: '💻',
    description: 'Dari komputer pertama sampai AI',
    color: '#78E08F',
  },
};

// ============================================================
// SEED MISSIONS (2-3 per category = ~15 total)
// ============================================================

export const missions: MissionDefinition[] = [
  // --- TOKOH DUNIA ---
  {
    id: 'einstein',
    category: 'tokoh_dunia',
    title: 'Albert Einstein — Si Otak Ajaib',
    description: 'Kenalan sama ilmuwan paling terkenal di dunia',
    icon: '🧠',
    totalSteps: 5,
    badgeTitle: 'Einstein Explorer',
    badgeIcon: '🧠',
    systemContext: 'Mission tentang Albert Einstein. Bahas: masa kecil Einstein yang dianggap lambat, teori relativitas yang disederhanakan (E=mc² artinya energi dan massa itu saling terkait), bagaimana dia kerja di kantor paten sambil mikir fisika, dan legacy-nya. Fun fact: Einstein gak pakai kaos kaki.',
    quizQuestions: [
      {
        question: 'Einstein terkenal karena teori apa?',
        options: ['Teori Gravitasi', 'Teori Relativitas', 'Teori Evolusi'],
        correctIndex: 1,
        explanation: 'Einstein terkenal karena Teori Relativitas — yang ngejelasin hubungan antara ruang, waktu, dan kecepatan cahaya.',
      },
      {
        question: 'Sebelum jadi ilmuwan terkenal, Einstein pernah kerja di mana?',
        options: ['Restoran', 'Kantor Paten', 'Toko Buku'],
        correctIndex: 1,
        explanation: 'Einstein pernah kerja di kantor paten di Swiss, dimana dia review penemuan orang lain sambil mikirin teori fisikanya sendiri!',
      },
    ],
  },
  {
    id: 'marie-curie',
    category: 'tokoh_dunia',
    title: 'Marie Curie — Ratu Radioaktif',
    description: 'Perempuan pertama yang menang Nobel Prize dua kali',
    icon: '⚗️',
    totalSteps: 5,
    badgeTitle: 'Curie Champion',
    badgeIcon: '⚗️',
    systemContext: 'Mission tentang Marie Curie. Bahas: perempuan pertama menang Nobel Prize (bahkan 2 kali!), penemuan radioaktivitas, perjuangan sebagai perempuan di dunia sains yang didominasi laki-laki, dan bagaimana penemuannya mengubah kedokteran. Fun fact: buku catatan Marie Curie masih radioaktif sampai sekarang!',
    quizQuestions: [
      {
        question: 'Berapa kali Marie Curie menang Nobel Prize?',
        options: ['1 kali', '2 kali', '3 kali'],
        correctIndex: 1,
        explanation: 'Marie Curie menang Nobel Prize 2 kali! Pertama di bidang Fisika, kedua di bidang Kimia. Dia satu-satunya orang yang menang Nobel di 2 bidang sains berbeda.',
      },
      {
        question: 'Apa yang ditemukan Marie Curie?',
        options: ['Listrik', 'Radioaktivitas', 'DNA'],
        correctIndex: 1,
        explanation: 'Marie Curie menemukan konsep radioaktivitas dan 2 unsur baru: Polonium dan Radium. Penemuannya mengubah dunia kedokteran.',
      },
    ],
  },
  {
    id: 'soekarno',
    category: 'tokoh_dunia',
    title: 'Soekarno — Bapak Kemerdekaan',
    description: 'Presiden pertama Indonesia yang keren banget',
    icon: '🇮🇩',
    totalSteps: 5,
    badgeTitle: 'Proklamasi Pro',
    badgeIcon: '🇮🇩',
    systemContext: 'Mission tentang Soekarno. Bahas: perannya dalam kemerdekaan Indonesia, pidatonya yang membakar semangat, Pancasila sebagai dasar negara, dan visinya tentang Indonesia. Fun fact: Soekarno bisa berbicara banyak bahasa dan dikenal sebagai orator ulung.',
    quizQuestions: [
      {
        question: 'Kapan Indonesia merdeka?',
        options: ['17 Agustus 1944', '17 Agustus 1945', '17 Agustus 1946'],
        correctIndex: 1,
        explanation: 'Indonesia merdeka pada 17 Agustus 1945. Soekarno dan Hatta memproklamasikan kemerdekaan di Jl. Pegangsaan Timur 56, Jakarta.',
      },
      {
        question: 'Apa dasar negara Indonesia yang digagas Soekarno?',
        options: ['UUD 1945', 'Pancasila', 'Bhinneka Tunggal Ika'],
        correctIndex: 1,
        explanation: 'Pancasila adalah dasar negara Indonesia yang digagas oleh Soekarno. Lima sila yang jadi panduan hidup berbangsa.',
      },
    ],
  },

  // --- PERISTIWA SEJARAH ---
  {
    id: 'kemerdekaan-ri',
    category: 'peristiwa_sejarah',
    title: 'Kemerdekaan Indonesia',
    description: 'Perjalanan panjang menuju merdeka',
    icon: '🏛️',
    totalSteps: 6,
    badgeTitle: 'Pahlawan Merdeka',
    badgeIcon: '🏛️',
    systemContext: 'Mission tentang kemerdekaan Indonesia. Bahas: masa penjajahan Belanda dan Jepang, perjuangan para pahlawan, peristiwa Rengasdengklok, proklamasi 17 Agustus 1945, dan arti kemerdekaan. Tetap age-appropriate — jangan detail kekerasan.',
    quizQuestions: [
      {
        question: 'Siapa yang membacakan teks proklamasi?',
        options: ['Soekarno', 'Mohammad Hatta', 'Tan Malaka'],
        correctIndex: 0,
        explanation: 'Soekarno yang membacakan teks proklamasi kemerdekaan Indonesia pada 17 Agustus 1945, didampingi Mohammad Hatta.',
      },
      {
        question: 'Indonesia pernah dijajah selama berapa ratus tahun oleh Belanda?',
        options: ['Sekitar 150 tahun', 'Sekitar 350 tahun', 'Sekitar 50 tahun'],
        correctIndex: 1,
        explanation: 'Indonesia dijajah Belanda selama sekitar 350 tahun (meskipun gak semua daerah dijajah selama itu). Lama banget kan!',
      },
    ],
  },
  {
    id: 'pendaratan-bulan',
    category: 'peristiwa_sejarah',
    title: 'Pendaratan di Bulan',
    description: 'Manusia pertama yang menginjakkan kaki di bulan',
    icon: '🌕',
    totalSteps: 5,
    badgeTitle: 'Moon Walker',
    badgeIcon: '🌕',
    systemContext: 'Mission tentang pendaratan Apollo 11 di bulan. Bahas: space race antara USA dan Soviet Union, astronaut Neil Armstrong, Buzz Aldrin, dan Michael Collins, "one small step for man", dan bagaimana mereka sampai di sana. Fun fact: jejak kaki di bulan masih ada karena gak ada angin!',
    quizQuestions: [
      {
        question: 'Siapa manusia pertama yang menginjakkan kaki di bulan?',
        options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin'],
        correctIndex: 1,
        explanation: 'Neil Armstrong adalah manusia pertama yang menginjakkan kaki di bulan pada 20 Juli 1969. Kata-katanya terkenal: "That\'s one small step for man, one giant leap for mankind."',
      },
      {
        question: 'Nama misi pendaratan bulan pertama?',
        options: ['Apollo 11', 'Apollo 13', 'Gemini 7'],
        correctIndex: 0,
        explanation: 'Apollo 11 adalah misi yang berhasil mendaratkan manusia di bulan untuk pertama kalinya.',
      },
    ],
  },

  // --- LUAR ANGKASA ---
  {
    id: 'tata-surya',
    category: 'luar_angkasa',
    title: 'Tata Surya Kita',
    description: '8 planet dan teman-temannya',
    icon: '☀️',
    totalSteps: 6,
    badgeTitle: 'Space Explorer',
    badgeIcon: '☀️',
    systemContext: 'Mission tentang tata surya. Bahas: matahari sebagai bintang, 8 planet (Merkurius sampai Neptunus), kenapa Pluto bukan planet lagi, asteroid belt, dan ukuran yang mind-blowing (Bumi itu titik kecil dibanding Jupiter). Fun fact: kalau bisa nyetir mobil ke matahari, butuh 170 tahun!',
    quizQuestions: [
      {
        question: 'Planet apa yang paling besar di tata surya kita?',
        options: ['Saturnus', 'Jupiter', 'Neptunus'],
        correctIndex: 1,
        explanation: 'Jupiter adalah planet terbesar! Besarnya 11 kali diameter Bumi. Kalau Jupiter itu bola basket, Bumi itu kelereng.',
      },
      {
        question: 'Kenapa Pluto bukan planet lagi?',
        options: ['Karena terlalu kecil', 'Karena orbitnya beda dari planet lain dan gak "bersihin" orbitnya', 'Karena terlalu jauh'],
        correctIndex: 1,
        explanation: 'Pluto direklasifikasi karena belum "membersihkan" lingkungan orbitnya dari objek lain. Sekarang statusnya "dwarf planet" — planet kerdil.',
      },
    ],
  },
  {
    id: 'hidup-di-mars',
    category: 'luar_angkasa',
    title: 'Hidup di Mars',
    description: 'Bisakah manusia tinggal di planet merah?',
    icon: '🔴',
    totalSteps: 5,
    badgeTitle: 'Mars Pioneer',
    badgeIcon: '🔴',
    systemContext: 'Mission tentang kemungkinan hidup di Mars. Bahas: kenapa Mars disebut planet merah, rover Perseverance dan Curiosity, tantangan hidup di Mars (gak ada oksigen, radiasi, dingin banget), dan rencana SpaceX/NASA. Fun fact: satu hari di Mars cuma 40 menit lebih lama dari Bumi!',
    quizQuestions: [
      {
        question: 'Kenapa Mars warnanya merah?',
        options: ['Karena panas', 'Karena banyak besi berkarat (oksida besi)', 'Karena dekat matahari'],
        correctIndex: 1,
        explanation: 'Mars merah karena permukaannya banyak mengandung oksida besi — basically besi berkarat! Makanya disebut "Planet Merah".',
      },
      {
        question: 'Berapa lama perjalanan dari Bumi ke Mars?',
        options: ['Sekitar 1 minggu', 'Sekitar 7 bulan', 'Sekitar 7 tahun'],
        correctIndex: 1,
        explanation: 'Perjalanan ke Mars memakan waktu sekitar 7 bulan! Jauh banget. Makanya belum ada manusia yang ke sana.',
      },
    ],
  },

  // --- HEWAN & ALAM ---
  {
    id: 'trex-evolusi',
    category: 'hewan_alam',
    title: 'T-Rex & Evolusi',
    description: 'Dari dinosaurus ke ayam goreng',
    icon: '🦖',
    totalSteps: 5,
    badgeTitle: 'Dino Expert',
    badgeIcon: '🦖',
    systemContext: 'Mission tentang T-Rex dan evolusi. Bahas: T-Rex sebagai predator apex, ternyata banyak dinosaurus berbulu, burung adalah keturunan dinosaurus, meteor yang bikin punah, dan konsep evolusi yang disederhanakan. Fun fact: T-Rex punya penglihatan yang lebih tajam dari elang!',
    quizQuestions: [
      {
        question: 'Burung adalah keturunan dari apa?',
        options: ['Reptil biasa', 'Dinosaurus', 'Ikan'],
        correctIndex: 1,
        explanation: 'Burung adalah keturunan langsung dari dinosaurus theropoda! Jadi technically, ayam goreng itu T-Rex versi mini. Hehe.',
      },
      {
        question: 'Apa yang bikin dinosaurus punah?',
        options: ['Banjir besar', 'Meteor raksasa', 'Kedinginan'],
        correctIndex: 1,
        explanation: 'Meteor raksasa nabrak Bumi 66 juta tahun lalu. Debunya nutupin matahari berbulan-bulan, bikin efek domino kepunahan.',
      },
    ],
  },
  {
    id: 'ekosistem-laut',
    category: 'hewan_alam',
    title: 'Ekosistem Laut',
    description: 'Dunia bawah laut yang misterius',
    icon: '🐋',
    totalSteps: 5,
    badgeTitle: 'Ocean Explorer',
    badgeIcon: '🐋',
    systemContext: 'Mission tentang ekosistem laut. Bahas: laut menutupi 70% Bumi tapi baru 5% yang dijelajahi, palung Mariana yang lebih dalam dari Everest tinggi, bioluminesensi, coral reef, dan ancaman polusi plastik. Fun fact: jantung paus biru sebesar mobil VW Beetle!',
    quizQuestions: [
      {
        question: 'Berapa persen lautan yang sudah dijelajahi manusia?',
        options: ['Sekitar 50%', 'Sekitar 5%', 'Sekitar 80%'],
        correctIndex: 1,
        explanation: 'Baru sekitar 5% lautan yang sudah dijelajahi! Artinya kita tau lebih banyak tentang permukaan bulan daripada dasar laut kita sendiri.',
      },
      {
        question: 'Apa itu bioluminesensi?',
        options: ['Hewan yang bisa terbang', 'Hewan yang bisa bercahaya sendiri', 'Hewan yang bisa berubah warna'],
        correctIndex: 1,
        explanation: 'Bioluminesensi adalah kemampuan makhluk hidup menghasilkan cahaya sendiri. Banyak hewan laut dalam yang bisa bercahaya di kegelapan — keren banget!',
      },
    ],
  },

  // --- PENEMUAN SAINS ---
  {
    id: 'gravitasi',
    category: 'penemuan_sains',
    title: 'Gravitasi — Kenapa Kita Gak Melayang',
    description: 'Newton, apel, dan gaya tarik bumi',
    icon: '🍎',
    totalSteps: 5,
    badgeTitle: 'Gravity Guru',
    badgeIcon: '🍎',
    systemContext: 'Mission tentang gravitasi. Bahas: cerita Newton dan apel (mungkin gak beneran jatuh di kepalanya), gravitasi sebagai gaya tarik antara semua benda bermassa, kenapa bulan gak jatuh ke Bumi, perbedaan gravitasi di planet lain, dan zero gravity di ISS. Fun fact: astronaut di ISS "melayang" bukan karena gak ada gravitasi — mereka sebenarnya jatuh terus tapi ke samping!',
    quizQuestions: [
      {
        question: 'Siapa yang terkenal karena "menemukan" gravitasi?',
        options: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei'],
        correctIndex: 1,
        explanation: 'Isaac Newton yang merumuskan hukum gravitasi universal setelah (katanya) melihat apel jatuh dari pohon.',
      },
      {
        question: 'Kenapa astronaut di ISS bisa melayang?',
        options: ['Karena gak ada gravitasi', 'Karena mereka sebenarnya "jatuh" terus menerus', 'Karena pakai alat khusus'],
        correctIndex: 1,
        explanation: 'Astronaut di ISS sebenarnya "jatuh" terus menerus bersama stasiun luar angkasanya — tapi kecepatannya pas sehingga mereka terus "meleset" dari Bumi. Ini disebut orbit!',
      },
    ],
  },
  {
    id: 'listrik',
    category: 'penemuan_sains',
    title: 'Listrik — Kekuatan yang Menerangi',
    description: 'Dari petir sampai lampu di kamar kamu',
    icon: '⚡',
    totalSteps: 5,
    badgeTitle: 'Electric Explorer',
    badgeIcon: '⚡',
    systemContext: 'Mission tentang listrik. Bahas: Benjamin Franklin dan petir (experiment layang-layang), apa itu elektron, Thomas Edison vs Nikola Tesla (DC vs AC), bagaimana listrik sampai ke rumah, dan energi terbarukan. Fun fact: petir itu 5 kali lebih panas dari permukaan matahari!',
    quizQuestions: [
      {
        question: 'Siapa yang melakukan eksperimen layang-layang dengan petir?',
        options: ['Thomas Edison', 'Benjamin Franklin', 'Nikola Tesla'],
        correctIndex: 1,
        explanation: 'Benjamin Franklin melakukan eksperimen layang-layang saat badai petir untuk membuktikan bahwa petir itu listrik. (Jangan ditiru ya!)',
      },
      {
        question: 'Petir lebih panas dari apa?',
        options: ['Air mendidih', 'Lava gunung berapi', 'Permukaan matahari'],
        correctIndex: 2,
        explanation: 'Petir bisa mencapai 30.000°C — 5 kali lebih panas dari permukaan matahari yang "cuma" 5.500°C!',
      },
    ],
  },

  // --- TEKNOLOGI ---
  {
    id: 'komputer-pertama',
    category: 'teknologi',
    title: 'Komputer Pertama',
    description: 'Dari seukuran ruangan sampai di saku kamu',
    icon: '🖥️',
    totalSteps: 5,
    badgeTitle: 'Tech Pioneer',
    badgeIcon: '🖥️',
    systemContext: 'Mission tentang sejarah komputer. Bahas: ENIAC sebagai komputer pertama (seukuran ruangan!), dari vacuum tube ke transistor ke microchip, evolusi dari mainframe ke PC ke smartphone, dan Moore\'s Law yang bikin komputer makin kecil dan kuat. Fun fact: smartphone kamu lebih powerful dari komputer yang ngirim manusia ke bulan!',
    quizQuestions: [
      {
        question: 'Komputer pertama (ENIAC) sebesar apa?',
        options: ['Sebesar meja', 'Sebesar ruangan', 'Sebesar lemari'],
        correctIndex: 1,
        explanation: 'ENIAC sebesar ruangan! Beratnya 30 ton dan butuh 150 kW listrik. Sekarang smartphone kita jutaan kali lebih powerful.',
      },
      {
        question: 'Smartphone kamu lebih kuat dari komputer apa?',
        options: ['Komputer yang bikin film Toy Story', 'Komputer yang ngirim manusia ke bulan', 'Keduanya benar'],
        correctIndex: 2,
        explanation: 'Keduanya benar! Smartphone modern jauh lebih kuat dari komputer Apollo yang ngirim manusia ke bulan DAN komputer yang merender film Toy Story pertama.',
      },
    ],
  },
  {
    id: 'ai-kecerdasan-buatan',
    category: 'teknologi',
    title: 'AI — Kecerdasan Buatan',
    description: 'Mesin yang bisa "belajar" — termasuk Papaw!',
    icon: '🤖',
    totalSteps: 5,
    badgeTitle: 'AI Apprentice',
    badgeIcon: '🤖',
    systemContext: 'Mission tentang AI/kecerdasan buatan. Bahas: apa itu AI secara sederhana (komputer yang bisa belajar dari contoh), contoh AI di kehidupan sehari-hari (YouTube recommendation, Google search, filter foto), perbedaan AI sekarang vs robot di film, dan kenapa AI itu tool bukan pengganti manusia. Fun fact: Papaw sendiri adalah AI! Tapi di balik Papaw ada Papa yang mengatur bagaimana Papaw harus ngobrol.',
    quizQuestions: [
      {
        question: 'Apa yang dimaksud dengan AI?',
        options: ['Robot yang mirip manusia', 'Komputer yang bisa belajar dari data', 'Komputer yang sangat cepat'],
        correctIndex: 1,
        explanation: 'AI (Artificial Intelligence) pada dasarnya adalah komputer yang bisa belajar dari data dan contoh — bukan robot yang mirip manusia kayak di film.',
      },
      {
        question: 'Mana yang bukan contoh AI di kehidupan sehari-hari?',
        options: ['Rekomendasi YouTube', 'Kalkulator biasa', 'Filter foto Instagram'],
        correctIndex: 1,
        explanation: 'Kalkulator biasa bukan AI — dia cuma mengikuti rumus yang sudah ditentukan. YouTube recommendation dan filter foto Instagram pakai AI untuk "belajar" apa yang kamu suka.',
      },
    ],
  },
];

// ============================================================
// MISSION ENGINE
// ============================================================

/**
 * Get all missions for a category
 */
export function getMissionsByCategory(category: MissionCategory): MissionDefinition[] {
  return missions.filter(m => m.category === category);
}

/**
 * Get a specific mission by ID
 */
export function getMission(missionId: string): MissionDefinition | undefined {
  return missions.find(m => m.id === missionId);
}

/**
 * Create initial mission state
 */
export function createMissionState(missionId: string): MissionState {
  return {
    missionId,
    phase: 'intro',
    currentStep: 0,
    quizAnswers: [],
    quizScore: 0,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Advance mission state machine
 * Returns the new state after processing the child's input
 */
export function advanceMissionState(
  state: MissionState,
  mission: MissionDefinition,
  quizAnswer?: number
): MissionState {
  const newState = { ...state };

  switch (state.phase) {
    case 'intro':
      // Move to first conversation step
      newState.phase = 'conversation';
      newState.currentStep = 0;
      break;

    case 'conversation':
      if (state.currentStep >= mission.totalSteps - 1) {
        // Conversation done, move to quiz
        newState.phase = 'quiz';
        newState.currentStep = 0;
      } else {
        // Next conversation step
        newState.currentStep = state.currentStep + 1;
      }
      break;

    case 'quiz':
      if (quizAnswer !== undefined) {
        const question = mission.quizQuestions[state.currentStep];
        const isCorrect = quizAnswer === question.correctIndex;

        newState.quizAnswers = [...state.quizAnswers, quizAnswer];
        newState.quizScore = state.quizScore + (isCorrect ? 1 : 0);

        if (state.currentStep >= mission.quizQuestions.length - 1) {
          // Quiz done
          newState.phase = 'complete';
        } else {
          newState.currentStep = state.currentStep + 1;
        }
      }
      break;

    case 'complete':
      // Already done, no more advances
      break;
  }

  return newState;
}

/**
 * Check if mission is complete and badge should be awarded
 * Badge is awarded regardless of quiz score (participation badge)
 */
export function shouldAwardBadge(state: MissionState): boolean {
  return state.phase === 'complete';
}

/**
 * Get all category infos with mission counts
 */
export function getAllCategories(): Omit<CategoryInfo, 'completedCount'>[] {
  return Object.values(categories).map(cat => ({
    ...cat,
    missions: getMissionsByCategory(cat.id),
  }));
}
