import { Interface, type Fragment, type FunctionFragment, type ParamType } from "ethers";

export type AbiFunctionKind = "read" | "write";

export interface ParsedAbiParameter {
  name: string;
  type: string;
  internalType?: string;
  isArray: boolean;
  isTuple: boolean;
  components: ParsedAbiParameter[];
}

export interface ParsedAbiFunction {
  name: string;
  kind: AbiFunctionKind;
  stateMutability: string;
  inputs: ParsedAbiParameter[];
  outputs: ParsedAbiParameter[];
  fragment: FunctionFragment;
}

export interface ParsedAbiContract {
  functions: ParsedAbiFunction[];
  readFunctions: ParsedAbiFunction[];
  writeFunctions: ParsedAbiFunction[];
}

function mapParameter(parameter: ParamType): ParsedAbiParameter {
  return {
    name: parameter.name ?? "",
    type: parameter.format("sighash"),
    internalType: parameter.type,
    isArray: typeof parameter.isArray === "function" ? parameter.isArray() : Boolean(parameter.isArray),
    isTuple: typeof parameter.isTuple === "function" ? parameter.isTuple() : Boolean(parameter.isTuple),
    components: (parameter.components ?? []).map(mapParameter),
  };
}

export function parseAbi(abi: unknown): ParsedAbiContract {
  if (!Array.isArray(abi)) {
    return { functions: [], readFunctions: [], writeFunctions: [] };
  }

  const iface = new Interface(abi as Array<string | Fragment>);
  const functions = iface.fragments
    .filter((fragment): fragment is FunctionFragment => fragment.type === "function")
    .map((func) => {
      const name = func.name ?? "unknown";
      const stateMutability = func.stateMutability ?? "nonpayable";
      const kind: AbiFunctionKind = ["view", "pure"].includes(stateMutability) ? "read" : "write";

      return {
        name,
        kind,
        stateMutability,
        inputs: func.inputs.map(mapParameter),
        outputs: func.outputs.map(mapParameter),
        fragment: func,
      };
    });

  return {
    functions,
    readFunctions: functions.filter((item) => item.kind === "read"),
    writeFunctions: functions.filter((item) => item.kind === "write"),
  };
}

export function formatAbiValue(value: unknown): string {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(formatAbiValue).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
