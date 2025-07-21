/* eslint-disable prefer-const */
import ort from 'onnxruntime-web';
import moveToAction from './move_to_action.json';
const CHAR_MAP = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'p',
  'n',
  'r',
  'k',
  'q',
  'P',
  'B',
  'N',
  'R',
  'Q',
  'K',
  'w',
  '.',
];
const CHAR_TO_INDEX = CHAR_MAP.reduce(
  (map, ch, idx) => {
    map[ch] = idx;
    return map;
  },
  {} as Record<string, number>,
);

export const tokenizeFEN = (fen: string) => {
  let [boardPart, side, castle, enPassant, halfMoves, fullMoves] =
    fen.split(' ');
  const flatBoard = boardPart.replace(/\//g, '');
  const sequence = side + flatBoard;
  const tokens: number[] = [];

  for (const ch of sequence) {
    if (ch >= '1' && ch <= '8') {
      tokens.push(...Array(parseInt(ch, 10)).fill(CHAR_TO_INDEX['.']));
    } else {
      tokens.push(CHAR_TO_INDEX[ch]);
    }
  }

  // Castling rights (always 4)
  if (castle === '-') {
    tokens.push(...Array(4).fill(CHAR_TO_INDEX['.']));
  } else {
    for (const ch of castle) tokens.push(CHAR_TO_INDEX[ch]);
    if (castle.length < 4) {
      tokens.push(...Array(4 - castle.length).fill(CHAR_TO_INDEX['.']));
    }
  }

  // En passant target (2 chars)
  if (enPassant === '-') {
    tokens.push(CHAR_TO_INDEX['.'], CHAR_TO_INDEX['.']);
  } else {
    for (const ch of enPassant) tokens.push(CHAR_TO_INDEX[ch]);
  }

  // Half-move clock (3 chars, pad with '.')
  halfMoves = halfMoves.padEnd(3, '.');
  for (const ch of halfMoves) tokens.push(CHAR_TO_INDEX[ch]);

  // Full-move number (3 chars, pad with '.')
  fullMoves = fullMoves.padEnd(3, '.');
  for (const ch of fullMoves) tokens.push(CHAR_TO_INDEX[ch]);

  if (tokens.length !== 77) {
    console.warn(`Expected 77 tokens but got ${tokens.length}`);
  }

  return tokens;
};

const getUniformBucketsEdgesValues = (numBuckets: number) => {
  const points = Array.from(
    { length: numBuckets + 1 },
    (_, i) => i / numBuckets,
  );
  const edges = points.slice(1, -1);
  const centers = points.slice(0, -1).map((v, i) => (v + points[i + 1]) / 2);
  return { edges, centers };
};

export const computeExpectedValue = (logits: number[]) => {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((v) => v / sumExps);
  const { centers } = getUniformBucketsEdgesValues(logits.length);

  return probs.reduce((sum, p, i) => sum + p * centers[i], 0);
};

export const moveStrToNum = (uci: string) => {
  const BOARD_STATE_VOCAB_SIZE = CHAR_MAP.length;
  const id = (moveToAction as Record<string, number>)[uci];
  if (id === undefined) {
    throw new Error(`Unknown UCI move "${uci}" - did you spell it right?`);
  }
  return BOARD_STATE_VOCAB_SIZE + id;
};

export const getMoveActionValue = async (
  fen: string,
  legalMoves: string[],
  inferSession: ort.InferenceSession,
) => {
  // -- tokenize & build input_ids as before --
  const stateTokens = tokenizeFEN(fen); // number[]
  const sequences = legalMoves.map((uci) => {
    const actionToken = moveStrToNum(uci); // number
    return [...stateTokens, actionToken].concat(
      Array(78 - stateTokens.length - 1).fill(0),
    );
  });
  const flat = sequences.flat(); // number[]
  const bigFlat = flat.map((v) => BigInt(v)); // BigInt[]
  const dims = [sequences.length, 78] as [number, number];
  const int64buf = BigInt64Array.from(bigFlat);
  const inputTensor = new ort.Tensor('int64', int64buf, dims);

  // -- run the model --
  const { predictions } = await inferSession.run({ input_ids: inputTensor });
  const data = predictions.data as Float32Array; // logits array

  // -- compute EV for each move and pick best/worst based on side --
  const isBlackTurn = fen.split(' ')[1] === 'b';
  let bestIdx = 0;
  // initialize bestValue for white to very small, for black to +∞
  let bestValue = isBlackTurn ? -Infinity : Infinity;

  for (let i = 0; i < sequences.length; i++) {
    // extract the i‑th logit slice:
    const offset = i * 78 * 128 + 77 * 128;
    const logits = Array.from(data.subarray(offset, offset + 128));
    const ev = computeExpectedValue(logits);
    console.log(
      `[AI] Move ${i + 1}/${sequences.length} (${legalMoves[i]}): EV = ${ev}`,
    );
    // if it's Black’s move, we want the *lowest* EV; else White wants the highest
    const isBetter = isBlackTurn ? ev > bestValue : ev < bestValue;

    if (isBetter) {
      bestValue = ev;
      bestIdx = i;
    }
  }
  console.log('BEST ev: ', bestValue);
  // -- package the result --
  const bestMove = legalMoves[bestIdx] as string;
  const allMoves = legalMoves.map((m, i) => ({
    move: m,
    value: i === bestIdx ? bestValue : null,
  }));

  return {
    bestMove,
    expectedValue: bestValue,
    allMoves,
  };
};
