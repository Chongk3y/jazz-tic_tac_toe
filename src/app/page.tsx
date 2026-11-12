"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw, Trophy, Volume2, VolumeX, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Player = "X" | "O";
type Square = Player | null;
type PokemonName = "Bulbasaur" | "Squirtle" | "Charmander";

const POKEMON: Record<
  PokemonName,
  {
    sprite: string;
    type: string;
    description: string;
    color: string;
    softColor: string;
  }
> = {
  Bulbasaur: {
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif",
    type: "Grass",
    description: "Leafy and clever",
    color: "#3d8b63",
    softColor: "#eaf7ed",
  },
  Squirtle: {
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/7.gif",
    type: "Water",
    description: "Cool and steady",
    color: "#3c82c4",
    softColor: "#eaf4fc",
  },
  Charmander: {
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif",
    type: "Fire",
    description: "Brave and fiery",
    color: "#e36a42",
    softColor: "#fff0ea",
  },
};

const POKEBALL_SPRITE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function createEmptyBoard(): Square[] {
  return Array(9).fill(null);
}

function getWinner(board: Square[]) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export default function Home() {
  const [board, setBoard] = useState<Square[]>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [scores, setScores] = useState<Record<Player, number>>({ X: 0, O: 0 });
  const [draws, setDraws] = useState(0);
  const [choices, setChoices] = useState<Record<Player, PokemonName | null>>({
    X: null,
    O: null,
  });
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const winner = useMemo(() => getWinner(board), [board]);
  const isDraw = !winner && board.every(Boolean);
  const gameOver = Boolean(winner || isDraw);
  const battleReady = Boolean(choices.X && choices.O);

  function startBattleMusic(force = false) {
    if ((!musicEnabled && !force) || musicStarted || typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
    audioContextRef.current = context;
    let noteIndex = 0;
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392];
    const playNote = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = notes[noteIndex % notes.length];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
      noteIndex += 1;
    };
    playNote();
    musicTimerRef.current = setInterval(playNote, 280);
    setMusicStarted(true);
  }

  function stopBattleMusic() {
    if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    musicTimerRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setMusicStarted(false);
  }

  useEffect(() => () => stopBattleMusic(), []);

  function playSquare(index: number) {
    if (board[index] || gameOver || !battleReady) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    const nextWinner = getWinner(nextBoard);

    setBoard(nextBoard);
    if (nextWinner) {
      setScores((current) => ({
        ...current,
        [nextWinner.player]: current[nextWinner.player] + 1,
      }));
    } else if (nextBoard.every(Boolean)) {
      setDraws((current) => current + 1);
    } else {
      setCurrentPlayer((current) => (current === "X" ? "O" : "X"));
    }
  }

  function newGame() {
    setBoard(createEmptyBoard());
    setCurrentPlayer("X");
  }

  function resetScore() {
    setScores({ X: 0, O: 0 });
    setDraws(0);
    newGame();
  }

  function choosePokemon(player: Player, pokemon: PokemonName) {
    if (board.some(Boolean)) return;
    const otherPlayer = player === "X" ? "O" : "X";
    if (choices[otherPlayer] === pokemon) return;
    startBattleMusic();
    setChoices((current) => ({ ...current, [player]: pokemon }));
  }

  function clearPokemon(player: Player) {
    if (board.some(Boolean)) return;
    setChoices((current) => ({ ...current, [player]: null }));
  }

  const status = !battleReady
    ? "Choose your Pokémon"
    : winner
    ? `${winner.player === "X" ? "Trainer 1" : "Trainer 2"} wins the round!`
    : isDraw
      ? "It’s a draw!"
      : `${currentPlayer === "X" ? "Trainer 1" : "Trainer 2"}'s turn`;

  return (
    <main className="battle-arena relative isolate min-h-screen overflow-hidden text-[#102a43]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e84444] shadow-[0_5px_15px_-6px_rgba(232,68,68,0.8)]">
              <Image
                src={POKEBALL_SPRITE}
                alt="Poké Ball"
                width={28}
                height={28}
                priority
                className="h-7 w-7 object-contain [image-rendering:pixelated]"
              />
            </div>
            <div>
              <span className="block truncate text-base font-extrabold tracking-tight sm:text-lg">Poké-Tac-Toe</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                Trainer battle
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/75 p-1 shadow-sm backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 sm:px-3"
              onClick={resetScore}
              title="Reset score"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset score</span>
              <span className="sr-only sm:hidden">Reset score</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label={musicEnabled ? "Mute battle theme" : "Play battle theme"}
              title={musicEnabled ? "Mute battle theme" : "Play battle theme"}
              onClick={() => {
                if (musicEnabled) {
                  stopBattleMusic();
                  setMusicEnabled(false);
                } else {
                  setMusicEnabled(true);
                  startBattleMusic(true);
                }
              }}
            >
              {musicEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </Button>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center pb-6 pt-10 sm:pb-8 sm:pt-16">
          <div className="mb-7 text-center sm:mb-9">
            <p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84444] sm:text-xs sm:tracking-[0.25em]">
              <Zap size={13} fill="currentColor" /> Choose your partner Pokémon
            </p>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Battle for the win.
            </h1>
            <p className="mx-auto mt-3 max-w-[19rem] text-xs leading-5 text-slate-500 sm:max-w-md sm:text-sm sm:leading-6">
              Each trainer picks a Pokémon, then takes turns lining up three marks to win.
            </p>
          </div>

          <div
            className={`mb-5 grid w-full max-w-3xl gap-2 sm:mb-7 sm:grid-cols-2 sm:gap-4 ${
              battleReady ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <PokemonPicker
              player="X"
              label="Trainer one"
              choice={choices.X}
              score={scores.X}
              active={battleReady && !gameOver && currentPlayer === "X"}
              onChoose={choosePokemon}
              onChange={clearPokemon}
              unavailable={choices.O}
              disabled={board.some(Boolean)}
              winner={winner?.player === "X"}
            />
            <PokemonPicker
              player="O"
              label="Trainer two"
              choice={choices.O}
              score={scores.O}
              active={battleReady && !gameOver && currentPlayer === "O"}
              onChoose={choosePokemon}
              onChange={clearPokemon}
              unavailable={choices.X}
              disabled={board.some(Boolean)}
              winner={winner?.player === "O"}
            />
          </div>

          <div className="grid w-full max-w-4xl gap-6">
            <Card className="battle-board mx-auto w-full max-w-[390px] border-[#f2d7a4] bg-[#fffdf7] p-3.5 sm:p-5">
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-[#e84444]" />
                    Battle arena
                  </p>
                  <p className="mt-1 text-base font-bold text-[#102a43]">{status}</p>
                </div>
                <div className="rounded-full bg-[#fff0d3] px-3 py-1 text-xs font-bold text-[#a66a1f]">
                  {draws} {draws === 1 ? "draw" : "draws"}
                </div>
              </div>
              <div className="battle-grid grid grid-cols-3 gap-2 rounded-[1.4rem] border-4 border-[#e84444] bg-[#fff0d3] p-2 sm:gap-2.5 sm:p-2.5">
                {board.map((square, index) => {
                  const isWinningSquare = winner?.line.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Square ${index + 1}${square ? `, ${square}` : ""}`}
                      onClick={() => playSquare(index)}
                      className={`battle-cell aspect-square rounded-xl border-2 text-4xl font-black transition-all duration-200 sm:text-5xl ${
                        isWinningSquare
                          ? "win-pop border-[#e8b44d] bg-[#ffe29a] text-[#d68c2c] shadow-[inset_0_0_0_3px_rgba(232,180,77,0.2)]"
                          : square
                            ? "border-[#dfe8ee] bg-[#f7fbfc]"
                            : "border-[#eadfd0] bg-white hover:-translate-y-1 hover:border-[#f0c86b] hover:bg-[#fffaf0]"
                      }`}
                    >
                      {square && (
                        <span className={square === "X" ? "text-[#e84444]" : "text-[#3c82c4]"}>
                          {choices[square] ? (
                            <PokemonBoardSprite
                              pokemon={choices[square]!}
                              priority={index < 3}
                            />
                          ) : (
                            square
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button className="mt-4 w-full" onClick={newGame}>
                {gameOver ? "Play again" : "New game"}
              </Button>
            </Card>
          </div>
        </section>

        <footer className="flex items-center justify-center gap-2 border-t border-slate-200/70 py-4 text-[11px] text-slate-400 sm:pt-5 sm:text-xs">
          <Trophy size={13} className="text-orange-400" />
          <span>Best of luck — have fun!</span>
        </footer>
      </div>
    </main>
  );
}

function PokemonPicker({
  player,
  label,
  choice,
  score,
  active,
  onChoose,
  onChange,
  unavailable,
  disabled,
  winner,
}: {
  player: Player;
  label: string;
  choice: PokemonName | null;
  score: number;
  active: boolean;
  onChoose: (player: Player, pokemon: PokemonName) => void;
  onChange: (player: Player) => void;
  unavailable: PokemonName | null;
  disabled: boolean;
  winner: boolean;
}) {
  return (
    <Card
      className={`pokemon-trainer-card p-3 sm:p-4 ${
        choice ? `pokemon-trainer-card--selected pokemon-trainer-card--${choice.toLowerCase()}` : ""
      } ${winner ? "winner-celebration" : ""}`}
      style={
        choice
          ? {
              borderColor: POKEMON[choice].color,
              background: `linear-gradient(135deg, ${POKEMON[choice].softColor} 0%, #ffffff 62%, #ffffff 100%)`,
              boxShadow: `0 18px 38px -25px ${POKEMON[choice].color}`,
            }
          : undefined
      }
    >
      {choice && (
        <div
          className="pokemon-card-accent"
          style={{ backgroundColor: POKEMON[choice].color }}
        />
      )}
      <div className="mb-2 flex items-start justify-between gap-1.5 sm:mb-3 sm:gap-2">
        <div>
          <p className="text-xs font-extrabold sm:text-sm">{label}</p>
          <p className="text-[10px] text-slate-400 sm:text-xs">
            {choice ? `${choice} selected` : "Pick your partner"}
          </p>
        </div>
        <span className="trainer-badge rounded-full px-1.5 py-1 text-[8px] font-black uppercase tracking-wider sm:px-2.5 sm:text-[10px]">
          {player === "X" ? "Red" : "Blue"}
        </span>
      </div>
      <div className={choice ? "grid grid-cols-1" : "grid grid-cols-3 gap-1.5 sm:gap-2"}>
        {(choice ? [choice] : (Object.keys(POKEMON) as PokemonName[])).map((pokemon) => {
          const details = POKEMON[pokemon];
          const selected = choice === pokemon;
          const takenByOtherTrainer = unavailable === pokemon;
          return (
            <div
              key={pokemon}
              className={choice ? "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center" : ""}
            >
              <button
                type="button"
                onClick={() => onChoose(player, pokemon)}
                disabled={disabled || takenByOtherTrainer}
                aria-label={`${pokemon}${takenByOtherTrainer ? ", already chosen by the other trainer" : ""}`}
                className={`rounded-2xl border p-2 text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                  choice
                    ? "flex min-w-0 flex-1 items-center gap-3 px-3 py-3"
                    : "flex min-h-[92px] w-full min-w-0 flex-col items-center justify-center px-1 py-1.5 text-center sm:min-h-0 sm:p-2"
                }`}
                style={{
                  borderColor: selected ? details.color : "#e2e8f0",
                  backgroundColor: selected ? details.softColor : "white",
                }}
              >
                <PokemonSprite pokemon={pokemon} size={choice ? 68 : 42} priority />
                <span className={choice ? "min-w-0" : ""}>
                  <span className="mt-1 block truncate text-[9px] font-extrabold sm:text-[11px]">{pokemon}</span>
                  <span className="block text-[9px] font-medium sm:text-[10px]" style={{ color: details.color }}>
                    {details.type}
                    <span className="hidden sm:inline"> · {details.description}</span>
                  </span>
                </span>
              </button>
              {choice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(player)}
                  disabled={disabled}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Change
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div
        className={`scoreboard-panel mt-4 flex items-center justify-between border-t pt-3 ${
          active ? "scoreboard-panel--active border-orange-200" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
              player === "X" ? "bg-[#fff0ea] text-[#e84444]" : "bg-[#eaf4fc] text-[#3c82c4]"
            }`}
            style={choice ? { backgroundColor: POKEMON[choice].softColor } : undefined}
          >
            {choice ? <PokemonSprite pokemon={choice} size={24} /> : player}
          </span>
          <span
            className="text-[10px] font-bold text-slate-500 sm:text-xs"
            style={choice ? { color: POKEMON[choice].color } : undefined}
          >
            {active ? "Your turn" : "Score"}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-black text-[#102a43]"
            style={choice ? { color: POKEMON[choice].color } : undefined}
          >
            {score}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
            {score === 1 ? "win" : "wins"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function PokemonSprite({
  pokemon,
  size,
  priority = false,
}: {
  pokemon: PokemonName;
  size: number;
  priority?: boolean;
}) {
  return (
    <span className="relative mx-auto block shrink-0" style={{ width: size, height: size }}>
      <Image
        src={POKEMON[pokemon].sprite}
        alt={pokemon}
        fill
        priority={priority}
        sizes={`${size}px`}
        className="object-contain [image-rendering:pixelated]"
      />
    </span>
  );
}

function PokemonBoardSprite({
  pokemon,
  priority = false,
}: {
  pokemon: PokemonName;
  priority?: boolean;
}) {
  return (
    <span className="relative mx-auto block h-[clamp(2.5rem,12vw,3.75rem)] w-[clamp(2.5rem,12vw,3.75rem)]">
      <Image
        src={POKEMON[pokemon].sprite}
        alt={pokemon}
        fill
        priority={priority}
        sizes="(max-width: 640px) 12vw, 60px"
        className="object-contain [image-rendering:pixelated]"
      />
    </span>
  );
}
