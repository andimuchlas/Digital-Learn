Siap. Dari catatan user + hasil interview, bentuk produknya sebenarnya sudah cukup jelas: **platform kuis multiplayer real-time berbasis lobby**, dengan visualisasi progres berupa **papan ular tangga 25 tile** yang hanya dilihat admin. Player bermain bersamaan seperti Kahoot, tetapi reward-nya berupa pergerakan karakter di board.

Berikut PRD yang sudah gue rapikan supaya bisa langsung dipakai sebagai acuan desain dan development. Manusia akhirnya berhasil menemukan cara membuat ujian terasa seperti permainan. Kemajuan peradaban memang aneh.

# PRD — Multiplayer Quiz Game

**Status:** Draft
**Platform:** Web Responsive
**Framework:** Next.js
**UI/Animation:** Fonttrio + GSAP
**Game Type:** Real-time Multiplayer Quiz
**Question Type:** Multiple Choice
**Maximum Questions:** 25 soal
**Player Model:** Multiple players dalam 1 lobby
**Reference Gameplay:** Kahoot-style synchronous quiz + Snake & Ladder progression

---

# 1. Product Overview

## 1.1 Konsep

Aplikasi merupakan **game kuis multiplayer real-time** yang memungkinkan banyak peserta bermain secara bersamaan dalam satu lobby.

Setiap peserta:

1. Masuk melalui **share link lobby**.
2. Mengisi **nama dan kelas**.
3. Menunggu admin memulai permainan.
4. Menjawab pertanyaan pilihan ganda.
5. Memiliki waktu terbatas untuk menjawab setiap soal.
6. Jika menjawab benar, karakter/player maju **1 tile** pada papan.
7. Jika salah atau waktu habis, player **tidak bergerak**.
8. Permainan berlangsung sampai seluruh **25 soal** selesai.
9. Setelah permainan selesai, sistem menampilkan **leaderboard**.

Admin memiliki kontrol penuh terhadap sesi permainan, termasuk:

* Mengelola soal.
* Mengatur waktu menjawab.
* Memulai permainan.
* Pause permainan.
* Melanjutkan permainan.
* Mengakhiri permainan.
* Melihat papan permainan.
* Melihat leaderboard.

---

# 2. Goals

## 2.1 Primary Goals

* Membuat proses kuis menjadi lebih interaktif dan kompetitif.
* Memungkinkan banyak peserta bermain secara real-time.
* Memberikan visualisasi progres peserta melalui board.
* Memudahkan admin/guru mengelola sesi permainan.
* Dapat digunakan melalui perangkat desktop maupun mobile.

## 2.2 Success Criteria

Sistem dianggap berhasil apabila:

* Peserta dapat masuk melalui share link.
* Peserta dapat mengisi identitas sebelum permainan dimulai.
* Semua peserta menerima pertanyaan yang sama secara bersamaan.
* Countdown berjalan sinkron.
* Jawaban peserta tercatat dengan benar.
* Player yang menjawab benar bergerak 1 tile.
* Admin dapat mengontrol state permainan.
* Permainan dapat berjalan sampai 25 soal.
* Leaderboard dapat ditampilkan setelah permainan selesai.
* UI dapat digunakan dengan baik pada mobile dan desktop.

---

# 3. User Roles

Terdapat dua role utama.

| Role       | Deskripsi                        |
| ---------- | -------------------------------- |
| **Admin**  | Pembuat dan pengontrol permainan |
| **Player** | Peserta yang mengikuti kuis      |

---

# 4. User Flow

## 4.1 Admin Flow

```text
Admin Login / Access
        ↓
Admin Dashboard
        ↓
Create / Select Game
        ↓
Configure Game
        ↓
Manage Questions
        ↓
Generate Lobby
        ↓
Share Lobby Link
        ↓
Players Join
        ↓
Lobby Waiting Room
        ↓
Admin Start
        ↓
Question 1
        ↓
Question 2
        ↓
...
        ↓
Question 25
        ↓
Game Finished
        ↓
Leaderboard
```

---

# 5. Player Flow

```text
Open Share Link
      ↓
Lobby Page
      ↓
Input Name + Class
      ↓
Join Lobby
      ↓
Waiting Room
      ↓
Admin Starts Game
      ↓
Game Explanation
      ↓
Question
      ↓
Answer
      ↓
Result
      ↓
Move / Stay
      ↓
Next Question
      ↓
...
      ↓
Question 25
      ↓
Final Leaderboard
```

---

# 6. Lobby System

## 6.1 Lobby Creation

Admin dapat membuat sebuah lobby permainan.

Lobby memiliki:

* `lobbyId`
* `lobbyCode`
* `shareLink`
* `status`
* `players`
* `game configuration`

Contoh:

```text
Lobby Code:
ABC123

Share Link:
https://domain.com/join/ABC123
```

---

# 7. Share Link

Flow utama dibuat sesederhana mungkin.

Admin membagikan:

```text
https://domain.com/join/ABC123
```

Player membuka link tersebut dan langsung diarahkan ke lobby.

### Player tidak perlu memasukkan kode secara manual

Karena link sudah mengandung identitas lobby.

Namun sistem tetap menyimpan **Lobby Code** sebagai fallback apabila player:

* keluar dari lobby,
* refresh dalam kondisi tertentu,
* kehilangan session,
* atau ingin masuk kembali.

---

# 8. Player Registration

Setelah membuka share link, player melihat form:

### Required

* Nama
* Kelas

Contoh:

```text
┌─────────────────────────────┐
│       QUIZ CHALLENGE        │
│                             │
│ Nama                        │
│ [ Andi Muchlas          ]   │
│                             │
│ Kelas                       │
│ [ XI RPL 2              ]   │
│                             │
│       [ MASUK LOBBY ]       │
└─────────────────────────────┘
```

### Validation

Nama:

* Required
* Tidak boleh kosong

Kelas:

* Required
* Tidak boleh kosong

Sistem sebaiknya mencegah nama duplikat dalam satu lobby.

---

# 9. Lobby Waiting Room

Setelah registration berhasil, player masuk ke waiting room.

Informasi yang ditampilkan:

* Nama game
* Status lobby
* Jumlah peserta
* Nama peserta
* Instruksi permainan
* Status admin
* Indikator bahwa game belum dimulai

Contoh:

```text
QUIZ CHALLENGE

Waiting for host...

Players:
• Andi
• Budi
• Citra
• Dimas
• Eka

5 Players Joined

Waiting for admin to start...
```

Player **tidak memiliki kontrol untuk memulai permainan**.

Hanya admin yang dapat melakukan start.

---

# 10. Game Explanation

Sebelum soal pertama dimulai, sistem menampilkan penjelasan singkat mengenai mekanisme.

Contoh:

```text
HOW TO PLAY

• Kamu akan mendapatkan 25 pertanyaan.
• Setiap pertanyaan memiliki batas waktu.
• Jawab dengan benar untuk maju 1 langkah.
• Jawaban salah tidak membuatmu maju.
• Jika waktu habis, kamu tetap di posisi.
• Pemain dengan posisi paling jauh akan mendapatkan
  peringkat lebih tinggi.

Good luck!
```

Durasi halaman explanation dapat dibuat singkat, misalnya **5 detik**, atau admin dapat menekan tombol **Continue/Start**.

---

# 11. Game Board

Game menggunakan konsep **Snake & Ladder / board progression**.

Total:

**25 tile**

Contoh:

```text
25 ─ 24 ─ 23 ─ 22 ─ 21
20 ─ 19 ─ 18 ─ 17 ─ 16
11 ─ 12 ─ 13 ─ 14 ─ 15
10 ─  9 ─  8 ─  7 ─  6
 1 ─  2 ─  3 ─  4 ─  5
```

Player mulai dari:

```text
START → Tile 1
```

Setiap jawaban benar:

```text
Current Tile + 1
```

Contoh:

```text
Player A
Tile 7

Correct Answer
    ↓
Tile 8
```

### Penting

**Tidak ada random dice roll.**

Pergerakan sepenuhnya ditentukan oleh jawaban.

Jadi:

```text
Correct → +1
Wrong   → Stay
Timeout → Stay
```

Ini membuat sistem jauh lebih mudah dipahami dan jauh lebih mudah diimplementasikan daripada memasukkan unsur dadu yang sebenarnya cuma menambah pekerjaan developer karena manusia rupanya suka RNG.

---

# 12. Board Visibility

Board hanya ditampilkan kepada:

### Admin

Admin memiliki layar khusus yang menampilkan:

* Board 25 tile
* Semua player
* Posisi setiap player
* Animasi player bergerak
* Ranking sementara

### Player

Player **tidak melihat board**.

Player hanya melihat:

* Question
* Countdown
* Answer options
* Feedback
* Personal progress/status

Tujuannya agar fokus player tetap pada pertanyaan dan tidak terlalu memenuhi layar dengan elemen yang tidak diperlukan.

---

# 13. Question System

Semua pertanyaan berbentuk:

**Multiple Choice**

Contoh:

```text
Apa ibu kota Indonesia?

A. Bandung
B. Jakarta
C. Surabaya
D. Semarang
```

Satu pertanyaan memiliki:

```text
Question
├── Question Text
├── Option A
├── Option B
├── Option C
├── Option D
└── Correct Answer
```

---

# 14. Question Randomization

Total soal yang tersedia dapat lebih dari 25.

Ketika game dimulai:

```text
Question Bank
      ↓
Randomize
      ↓
Select 25 Questions
      ↓
Game
```

Dengan demikian, jika tersedia misalnya 100 soal, setiap sesi dapat menggunakan kombinasi 25 soal yang berbeda.

### Important

Randomization dilakukan **ketika game/session dibuat atau dimulai**, bukan setiap player mendapatkan random question yang berbeda.

Semua player mendapatkan:

> **Urutan pertanyaan yang sama.**

Contoh:

```text
Question 1 → Semua player
Question 2 → Semua player
Question 3 → Semua player
...
```

Ini penting supaya kompetisinya fair.

---

# 15. Question Timer

Admin dapat mengatur durasi pengerjaan soal secara global.

Contoh:

```text
Question Time:
30 seconds
```

Nilai ini berlaku untuk seluruh pertanyaan dalam satu game.

Contoh konfigurasi:

```text
Question Timer
[ 30 ] seconds
```

Kemungkinan value:

```text
10
15
20
30
45
60
```

atau admin dapat memasukkan angka custom.

---

# 16. Countdown

Setiap pertanyaan memiliki countdown.

Contoh:

```text
             18

Apa ibu kota Indonesia?

┌────────┐ ┌────────┐
│   A    │ │   B    │
│Bandung │ │Jakarta │
└────────┘ └────────┘

┌────────┐ ┌────────┐
│   C    │ │   D    │
│Surabaya│ │Semarang│
└────────┘ └────────┘
```

Countdown harus terlihat jelas terutama pada mobile.

### Recommended visual states

```text
Normal
↓
Warning
↓
Critical
↓
Time Up
```

Misalnya:

```text
30 ───────── 10 ───── 5 ── 0
```

Pada 5 detik terakhir, countdown dapat diberi animasi lebih agresif menggunakan GSAP.

---

# 17. Answer Flow

Player memilih salah satu jawaban.

Contoh:

```text
Player selects B
       ↓
Answer locked
       ↓
Player cannot change answer
       ↓
Wait until timer ends
       ↓
Evaluate answer
```

**Jawaban sebaiknya langsung di-lock setelah dipilih.**

Ini mencegah player mengubah jawaban setelah sistem menerima input.

---

# 18. Result Logic

Setelah timer berakhir:

### Correct

```text
Correct
  ↓
Player moves +1 tile
```

### Wrong

```text
Wrong
  ↓
Player stays
```

### Timeout

```text
Time Up
  ↓
Player stays
```

Tidak ada pengurangan posisi.

---

# 19. Player Movement Animation

Ketika jawaban benar:

```text
Tile 5
  ↓
Tile 6
```

Admin melihat karakter player bergerak menggunakan GSAP.

Contoh:

```text
[5] → [6]
```

Animasi dapat berupa:

* Move
* Bounce
* Scale
* Highlight destination tile

Contoh sequence:

```text
Answer Correct
      ↓
Correct feedback
      ↓
Character moves
      ↓
Character lands
      ↓
Tile highlight
      ↓
Next question
```

Durasi animasi harus cukup pendek supaya tidak mengganggu ritme permainan.

Recommended:

**500–1000 ms**

---

# 20. Game Synchronization

Karena game bersifat real-time, server harus menjadi sumber kebenaran utama.

Client tidak boleh menentukan sendiri:

* apakah jawaban benar,
* kapan soal berakhir,
* posisi player,
* game selesai atau belum.

Server menentukan:

```text
Current Question
Question Start Time
Question End Time
Game State
Player Answers
Player Positions
```

Client hanya merender state tersebut.

---

# 21. Game State

Game memiliki beberapa state:

```text
DRAFT
  ↓
LOBBY
  ↓
READY
  ↓
RUNNING
  ↓
PAUSED
  ↓
RUNNING
  ↓
FINISHED
```

### DRAFT

Game sedang dibuat/dikonfigurasi.

### LOBBY

Player dapat masuk.

### READY

Player sudah berada di lobby dan menunggu start.

### RUNNING

Pertanyaan sedang berlangsung.

### PAUSED

Permainan dihentikan sementara oleh admin.

### FINISHED

25 soal selesai.

---

# 22. Admin Controls

Admin memiliki kontrol utama:

```text
[ START GAME ]

[ PAUSE ]

[ RESUME ]

[ END GAME ]
```

---

## Start

Memulai game dari lobby.

Syarat:

* Game memiliki soal.
* Minimal player sesuai aturan yang ditentukan.
* Game belum dimulai.

---

## Pause

Ketika admin menekan pause:

```text
RUNNING
   ↓
PAUSED
```

Timer berhenti.

Player tidak dapat menjawab sementara.

UI player:

```text
GAME PAUSED

Please wait for the host...
```

---

## Resume

```text
PAUSED
   ↓
RUNNING
```

Timer dilanjutkan berdasarkan mekanisme pause yang ditetapkan.

**Recommended:** timer berhenti total ketika pause, kemudian melanjutkan sisa waktu yang ada.

---

## End Game

Admin dapat mengakhiri game secara manual.

Sistem meminta confirmation:

```text
Are you sure?

Ending the game will prevent players
from continuing.

[ CANCEL ] [ END GAME ]
```

Setelah dikonfirmasi:

```text
FINISHED
```

Leaderboard ditampilkan.

---

# 23. Admin Dashboard

Dashboard admin menjadi pusat kontrol permainan.

Layout desktop:

```text
┌──────────────────────────────────────────────┐
│ QUIZ GAME                         GAME STATUS │
├──────────────────────────────────────────────┤
│                                              │
│                 GAME BOARD                   │
│                                              │
│              21 20 19 18 17                  │
│              12 13 14 15 16                  │
│               9  8  7  6  5                  │
│               1  2  3  4                    │
│                                              │
├───────────────────────┬──────────────────────┤
│ Players               │ Controls             │
│                       │                      │
│ Andi      Tile 18     │ [PAUSE]              │
│ Budi      Tile 15     │ [END GAME]           │
│ Citra     Tile 13     │                      │
└───────────────────────┴──────────────────────┘
```

---

# 24. Live Leaderboard

Admin dapat melihat leaderboard selama permainan.

Ranking berdasarkan:

1. **Current Tile / Score**
2. Jika posisi sama, gunakan **jumlah jawaban benar**
3. Jika masih sama, gunakan **total waktu menjawab** sebagai tie-breaker jika memang ingin sistem ranking lebih granular.

Namun untuk MVP, sebenarnya cukup:

```text
Position > Correct Answer
```

Contoh:

| Rank | Player | Tile | Correct |
| ---: | ------ | ---: | ------: |
|    1 | Andi   |   19 |      19 |
|    2 | Budi   |   17 |      17 |
|    3 | Citra  |   15 |      15 |
|    4 | Dimas  |   12 |      12 |

---

# 25. Final Leaderboard

Setelah 25 soal selesai:

```text
GAME FINISHED

FINAL LEADERBOARD

🥇 Andi
    22 / 25

🥈 Budi
    20 / 25

🥉 Citra
    18 / 25

4. Dimas
    17 / 25
```

Leaderboard dapat menampilkan:

* Rank
* Nama
* Kelas
* Score
* Correct answers
* Final tile

---

# 26. Question Management

Admin dapat mengelola question bank.

CRUD:

```text
Create
Read
Update
Delete
```

Admin memasukkan soal sendiri.

Sistem **tidak menyediakan soal otomatis**.

---

# 27. Question Editor

Form:

```text
Question

[ Apa ibu kota Indonesia? ]

Option A
[ Bandung ]

Option B
[ Jakarta ]

Option C
[ Surabaya ]

Option D
[ Semarang ]

Correct Answer

[ B ]

[ SAVE QUESTION ]
```

---

# 28. Question List

Admin dapat melihat:

```text
QUESTION BANK

#   Question                     Answer

1   Apa ibu kota Indonesia?      B
2   2 + 2 = ?                    C
3   ...                           A

[ EDIT ] [ DELETE ]
```

Search/filter dapat ditambahkan jika jumlah soal besar.

---

# 29. Game Configuration

Sebelum lobby dibuat, admin dapat mengatur:

### Game Name

```text
[ Quiz Matematika XI RPL ]
```

### Question Count

Untuk MVP:

```text
25 Questions
```

Bisa dibuat configurable untuk future development.

### Question Timer

```text
[ 30 ] seconds
```

### Random Question

```text
☑ Randomize Questions
```

Untuk MVP dapat dibuat default:

```text
ON
```

---

# 30. Responsive Design

Karena device peserta bisa apa saja, aplikasi wajib responsive.

Target:

* Desktop
* Laptop
* Tablet
* Mobile

### Player

Prioritas:

**Mobile First**

Karena sangat mungkin peserta masuk menggunakan HP.

UI harus menghindari:

* Horizontal scrolling
* Text terlalu kecil
* Button terlalu kecil
* Countdown tidak terlihat
* Option terlalu dekat
* Animasi yang menyebabkan layout shifting

---

# 31. Admin vs Player UI

## Player

Fokus:

```text
Question
↓
Countdown
↓
Answer
↓
Feedback
```

Minimal distraction.

## Admin

Fokus:

```text
Board
+
Player positions
+
Game state
+
Controls
+
Leaderboard
```

---

# 32. Animation Requirements

Menggunakan **GSAP**.

Animation utama:

### Lobby

* Player join animation
* Player count update

### Game

* Question entrance
* Countdown animation
* Answer selection
* Correct/wrong feedback
* Player movement
* Tile highlight
* Leaderboard transition

### Finish

* Game completion animation
* Leaderboard reveal

Animation harus menjadi **feedback**, bukan dekorasi yang membuat website terasa seperti PowerPoint sedang mengalami krisis identitas.

---

# 33. Suggested Architecture

Untuk Next.js:

```text
Next.js
│
├── Player App
│   ├── Join
│   ├── Lobby
│   ├── Game
│   └── Result
│
├── Admin App
│   ├── Dashboard
│   ├── Question Bank
│   ├── Game Configuration
│   ├── Lobby
│   └── Game Monitor
│
├── API
│
└── Realtime Layer
```

---

# 34. Core Data Model

## User / Player

```text
Player
├── id
├── lobbyId
├── name
├── class
├── position
├── correctAnswers
├── wrongAnswers
├── status
└── joinedAt
```

---

## Question

```text
Question
├── id
├── text
├── optionA
├── optionB
├── optionC
├── optionD
├── correctAnswer
└── createdAt
```

---

## Game

```text
Game
├── id
├── name
├── status
├── questionTime
├── totalQuestions
├── currentQuestion
├── questions
├── createdAt
└── finishedAt
```

---

## Lobby

```text
Lobby
├── id
├── code
├── gameId
├── status
├── players
└── createdAt
```

---

# 35. Realtime Events

Sistem membutuhkan event real-time.

Contoh:

```text
PLAYER_JOINED
PLAYER_LEFT

GAME_STARTED
GAME_PAUSED
GAME_RESUMED
GAME_FINISHED

QUESTION_STARTED
QUESTION_ENDED

ANSWER_SUBMITTED
ANSWER_RESULT

PLAYER_MOVED

LEADERBOARD_UPDATED
```

Contoh:

```text
QUESTION_STARTED
{
    questionNumber: 7,
    questionId: "...",
    startedAt: "...",
    endsAt: "..."
}
```

Client kemudian menghitung countdown berdasarkan timestamp server.

---

# 36. Anti-Cheat / Validation

Karena game kompetitif, beberapa validasi dasar wajib ada.

Server harus memastikan:

* Player hanya dapat menjawab satu kali.
* Player tidak dapat menjawab setelah timer habis.
* Player tidak dapat mengubah jawaban.
* Player tidak dapat menentukan sendiri posisi.
* Player tidak dapat submit jawaban untuk question yang sudah selesai.
* Player tidak dapat mengakses admin endpoint.
* Correct answer tidak dikirim ke client sebelum jawaban dikunci.

Yang terakhir penting.

Jangan kirim:

```json
{
  "question": "...",
  "correctAnswer": "B"
}
```

ke browser sebelum waktunya, karena peserta cukup membuka DevTools dan tiba-tiba menjadi Albert Einstein versi inspect element.

---

# 37. Error & Edge Cases

## Player refresh

Player harus dapat reconnect ke lobby/game menggunakan session/token.

## Player disconnect

Status:

```text
DISCONNECTED
```

Jika reconnect:

```text
RECONNECTED
```

Posisi dan progress tetap dipertahankan.

## Admin disconnect

Ini harus ditangani.

Recommended:

```text
Admin disconnected
       ↓
Game temporarily paused
       ↓
Waiting for admin reconnect
```

## Player masuk ketika game sudah dimulai

Default:

**Tidak diperbolehkan.**

Player melihat:

```text
Game already started.
You cannot join this session.
```

Ini menghindari orang masuk di soal ke-17 lalu tiba-tiba ikut lomba dengan start lebih lambat.

---

# 38. MVP Scope

Untuk versi pertama, fitur yang **WAJIB**:

### Player

* Share link lobby
* Join lobby
* Input nama
* Input kelas
* Waiting room
* Game explanation
* Multiple choice question
* Countdown
* Submit answer
* Correct/wrong result
* Next question
* Final leaderboard
* Responsive mobile UI

### Admin

* Create game
* Create/edit/delete questions
* Configure timer
* Create lobby
* Share lobby
* See players
* Start game
* Pause
* Resume
* End game
* See live board
* See live leaderboard
* See final leaderboard

### Game

* 25 questions
* Random question order
* Synchronous questions
* Correct = +1 tile
* Wrong = stay
* Timeout = stay
* 25-tile board
* Real-time synchronization

---

# 39. Out of Scope untuk MVP

Jangan masukkan ini dulu kecuali requirement berubah:

* Login/social login player
* Profile player
* Avatar customization
* Chat
* Voice chat
* Power-up
* Item
* Dice
* Snake/ladder mechanic
* Multiple game modes
* Ranking global antar game
* Achievement
* XP system
* Coins
* Shop
* Sound effects kompleks
* Question import Excel
* AI question generator
* Analytics kompleks
* Anti-cheat tingkat lanjut

MVP-nya harus selesai dulu. Kita tidak perlu membuat **Kahoot + Monopoly + Steam + LinkedIn** dalam satu sprint.

---

# 40. MVP Acceptance Criteria

## Lobby

* [ ] Admin dapat membuat lobby.
* [ ] Admin dapat membagikan link.
* [ ] Player dapat masuk melalui link.
* [ ] Player dapat memasukkan nama dan kelas.
* [ ] Player muncul di lobby admin.
* [ ] Player dapat melihat peserta lain.
* [ ] Player menunggu sampai admin memulai.

## Game

* [ ] Admin dapat start.
* [ ] Semua player menerima question yang sama.
* [ ] Countdown berjalan.
* [ ] Player hanya dapat memilih satu jawaban.
* [ ] Jawaban dikunci setelah submit.
* [ ] Correct answer membuat player maju 1 tile.
* [ ] Wrong answer membuat player tetap.
* [ ] Timeout membuat player tetap.
* [ ] Semua player pindah ke soal berikutnya secara sinkron.
* [ ] Game berhenti setelah 25 soal.

## Admin

* [ ] Admin dapat pause.
* [ ] Admin dapat resume.
* [ ] Admin dapat end game.
* [ ] Admin dapat melihat board.
* [ ] Admin dapat melihat posisi setiap player.
* [ ] Admin dapat melihat leaderboard.
* [ ] Admin dapat mengatur timer.
* [ ] Admin dapat CRUD question.

## Result

* [ ] Final leaderboard muncul.
* [ ] Ranking benar.
* [ ] Score sesuai jumlah jawaban benar.
* [ ] Posisi player sesuai progress.

---

# 41. Recommended Page Structure

Struktur route Next.js:

```text
/
├── /admin
│   ├── /dashboard
│   ├── /games
│   ├── /games/new
│   ├── /games/[gameId]
│   ├── /games/[gameId]/questions
│   └── /games/[gameId]/lobby
│
└── /join/[lobbyCode]
    ├── registration
    ├── lobby
    ├── game
    └── result
```

Atau secara konseptual:

```text
ADMIN

Dashboard
   ↓
Game Setup
   ↓
Question Management
   ↓
Lobby
   ↓
Live Game
   ↓
Result


PLAYER

Join Link
   ↓
Registration
   ↓
Lobby
   ↓
Explanation
   ↓
Quiz
   ↓
Result
```

---

# 42. Core Gameplay Loop

Ini bagian paling penting dari keseluruhan produk:

```text
QUESTION
   ↓
30s COUNTDOWN
   ↓
PLAYER ANSWERS
   ↓
SERVER VALIDATES
   ↓
CORRECT?
 ┌───────┴────────┐
YES               NO/TIMEOUT
 ↓                    ↓
+1 TILE              STAY
 └────────┬───────────┘
          ↓
    RESULT FEEDBACK
          ↓
     NEXT QUESTION
          ↓
      REPEAT ×25
          ↓
      LEADERBOARD
```

Jadi sebenarnya **board bukan gameplay utama**, melainkan **visual progression dan competitive feedback**. Gameplay utamanya tetap quiz.

Itu keputusan yang bagus untuk MVP karena secara teknis jauh lebih sederhana, tetapi secara visual masih memberikan rasa "game", bukan sekadar Google Form yang diberi countdown.

---

# 43. Prioritas Development

Gue akan membagi development menjadi seperti ini:

### Phase 1 — Foundation

* Next.js setup
* Fonttrio
* Responsive design system
* Database
* Game model
* Question model
* Lobby model

### Phase 2 — Admin

* Dashboard
* Question CRUD
* Game configuration
* Lobby creation
* Player monitoring

### Phase 3 — Player

* Join link
* Registration
* Lobby
* Waiting state
* Game UI

### Phase 4 — Realtime

* Lobby synchronization
* Question synchronization
* Countdown synchronization
* Answer submission
* Player progression
* Pause/resume

### Phase 5 — Board

* 25 tiles
* Player markers
* GSAP movement
* Live ranking

### Phase 6 — Result

* Final scoring
* Leaderboard
* Game completion

### Phase 7 — Polish

* Responsive refinement
* Animation
* Loading states
* Error states
* Reconnection
* Edge cases
* Performance testing

---

## 44. Satu keputusan desain yang sebaiknya dikunci sekarang

Ada satu hal yang masih **ambigu dari requirement awal**:

> "klo gk bisa menjawab bakal stay, klo beber maju"

Di PRD ini gue interpretasikan sebagai:

**Benar = maju 1 tile, salah = stay, timeout = stay.**

Dengan model itu, **score = jumlah jawaban benar = posisi player** sampai maksimal tile 25.

Jadi tidak perlu sistem score terpisah untuk MVP.

```text
25 Questions
       ↓
Maximum Position = 25
Maximum Score = 25
```

Ini membuat leaderboard sangat sederhana dan transparan. Dan karena semua peserta mengerjakan soal yang sama secara bersamaan, kompetisinya menjadi sangat mudah dipahami: **siapa paling banyak benar, dia paling jauh.**
