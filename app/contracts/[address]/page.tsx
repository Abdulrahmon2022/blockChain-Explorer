"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/stores/toastStore";
import { FileCode, Play, Eye, Loader2 } from "lucide-react";
import { BrowserProvider, type Signer } from "ethers";
import { AbiNetworkError, AbiNotVerifiedError, InvalidAbiError, fetchContractAbi, createContractInstance } from "@/services/contracts/abi";
import { parseAbi, type ParsedAbiFunction, type ParsedAbiParameter } from "@/services/contracts/parser";
import { executeReadMethod, executeWriteMethod } from "@/services/contracts/contract";
import { coerceParameterValue, validateParameterValue } from "@/services/contracts/validation";

interface ContractFunctionState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

function buildFunctionState(): ContractFunctionState {
  return { values: {}, errors: {} };
}

function updateNestedValue(values: Record<string, unknown>, path: string[], nextValue: unknown): Record<string, unknown> {
  const updated = { ...values };
  let current: Record<string, unknown> = updated;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const existing = current[segment];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      current[segment] = { ...(existing as Record<string, unknown>) };
    } else {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = nextValue;
  return updated;
}

function getParameterLabel(parameter: ParsedAbiParameter) {
  return parameter.name || parameter.type;
}

export default function ContractPage(props: PageProps<"/contracts/[address]">) {
  const { address } = use(props.params);
  const decodedAddress = decodeURIComponent(address);
  const addToast = useToastStore((state) => state.addToast);

  const [readStates, setReadStates] = useState<Record<string, ContractFunctionState>>({});
  const [writeStates, setWriteStates] = useState<Record<string, ContractFunctionState>>({});
  const [readResults, setReadResults] = useState<Record<string, string>>({});
  const [writeResults, setWriteResults] = useState<Record<string, string>>({});
  const [writeEstimations, setWriteEstimations] = useState<Record<string, string>>({});
  const [readLoading, setReadLoading] = useState<Record<string, boolean>>({});
  const [writeLoading, setWriteLoading] = useState<Record<string, boolean>>({});
  const [estimatingGas, setEstimatingGas] = useState<Record<string, boolean>>({});
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<"not-installed" | "disconnected" | "connected">("disconnected");
  const [signer, setSigner] = useState<Signer | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setWalletStatus("not-installed");
      return;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletStatus("connected");
        const provider = new BrowserProvider(ethereum);
        setSigner(await provider.getSigner());
      } else {
        setWalletAddress(null);
        setWalletStatus("disconnected");
        setSigner(null);
      }
    };

    ethereum.request({ method: "eth_accounts" }).then(handleAccountsChanged).catch(() => setWalletStatus("disconnected"));
    ethereum.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setWalletStatus("not-installed");
      return;
    }

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(ethereum);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);
      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletStatus("connected");
      }
    } catch (err) {
      setWalletStatus("disconnected");
      addToast({
        type: "error",
        title: "Wallet connection failed",
        description: err instanceof Error ? err.message : "Unable to connect wallet.",
      });
    }
  };

  const { data: abiData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["contractAbi", decodedAddress],
    queryFn: () => fetchContractAbi(decodedAddress),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const abi = useMemo(() => (Array.isArray(abiData) ? abiData : []), [abiData]);
  const parsedAbi = useMemo(() => parseAbi(abi), [abi]);
  const readFunctions = parsedAbi.readFunctions;
  const writeFunctions = parsedAbi.writeFunctions;

  const queryError = error instanceof Error ? error : null;
  const isNotVerified = queryError instanceof AbiNotVerifiedError;
  const isInvalidAbi = queryError instanceof InvalidAbiError;
  const isNetworkFailure = queryError instanceof AbiNetworkError || isError;

  const breadcrumbs = [
    { label: "Addresses", href: `/addresses/${decodedAddress}` },
    { label: "Contract Interface" },
  ];

  const getFunctionState = (functions: Record<string, ContractFunctionState>, functionName: string) => {
    return functions[functionName] ?? buildFunctionState();
  };

  const updateFunctionState = (
    setter: React.Dispatch<React.SetStateAction<Record<string, ContractFunctionState>>>,
    functionName: string,
    patch: Partial<ContractFunctionState> | ((previous: ContractFunctionState) => ContractFunctionState)
  ) => {
    setter((current) => {
      const previous = current[functionName] ?? buildFunctionState();
      const nextValue = typeof patch === "function" ? patch(previous) : { ...previous, ...patch };
      return { ...current, [functionName]: nextValue };
    });
  };

  const updateFunctionValue = (
    setter: React.Dispatch<React.SetStateAction<Record<string, ContractFunctionState>>>,
    functionName: string,
    path: string[],
    nextValue: unknown
  ) => {
    updateFunctionState(setter, functionName, (previous) => ({
      ...previous,
      values: updateNestedValue(previous.values, path, nextValue),
      errors: { ...previous.errors, [path.join(".")]: "" },
    }));
  };

  const getValueAtPath = (values: Record<string, unknown>, path: string[]) => {
    let current: unknown = values;
    for (const segment of path) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  };

  const getErrorAtPath = (errors: Record<string, string>, path: string[]) => errors[path.join(".")] ?? "";

  const validateParameter = (
    parameter: ParsedAbiParameter,
    value: unknown,
    path: string[],
    errors: Record<string, string>
  ) => {
    const error = validateParameterValue(parameter, value);
    if (error) {
      errors[path.join(".")] = error;
      return;
    }

    if (parameter.isTuple && parameter.components.length > 0 && typeof value === "object" && !Array.isArray(value)) {
      for (const component of parameter.components) {
        validateParameter(component, (value as Record<string, unknown>)[component.name || component.type], [...path, component.name || component.type], errors);
      }
    }

    if (parameter.isArray) {
      const items = Array.isArray(value)
        ? value
        : typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const component = parameter.components[0];
      if (component) {
        items.forEach((item, index) => {
          validateParameter(component, item, [...path, String(index)], errors);
        });
      }
    }
  };

  const validateFunctionInputs = (functionDefinition: ParsedAbiFunction, state: ContractFunctionState) => {
    const errors: Record<string, string> = {};

    functionDefinition.inputs.forEach((parameter) => {
      validateParameter(parameter, state.values[parameter.name || parameter.type], [parameter.name || parameter.type], errors);
    });

    return errors;
  };

  const collectArgs = (functionDefinition: ParsedAbiFunction, state: ContractFunctionState) => {
    return functionDefinition.inputs.map((parameter) => {
      const key = parameter.name || parameter.type;
      const value = getValueAtPath(state.values, [key]);
      return coerceParameterValue(parameter, value);
    });
  };

  const handleReadFunction = async (functionDefinition: ParsedAbiFunction) => {
    const state = getFunctionState(readStates, functionDefinition.name);
    const validationErrors = validateFunctionInputs(functionDefinition, state);
    if (Object.keys(validationErrors).length > 0) {
      updateFunctionState(setReadStates, functionDefinition.name, { errors: validationErrors });
      return;
    }

    setReadLoading((current) => ({ ...current, [functionDefinition.name]: true }));
    try {
      const contract = createContractInstance(decodedAddress, abi);
      const result = await executeReadMethod(contract, functionDefinition.name, collectArgs(functionDefinition, state));
      setReadResults((current) => ({ ...current, [functionDefinition.name]: result.value }));
      addToast({
        type: "success",
        title: "Read Successful",
        description: `Executed ${functionDefinition.name}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Read Failed",
        description: error instanceof Error ? error.message : "Unable to read contract state.",
      });
    } finally {
      setReadLoading((current) => ({ ...current, [functionDefinition.name]: false }));
    }
  };

  const estimateGasForFunction = async (functionDefinition: ParsedAbiFunction) => {
    const state = getFunctionState(writeStates, functionDefinition.name);
    const validationErrors = validateFunctionInputs(functionDefinition, state);
    if (Object.keys(validationErrors).length > 0) {
      updateFunctionState(setWriteStates, functionDefinition.name, { errors: validationErrors });
      return;
    }

    if (!signer) {
      addToast({
        type: "error",
        title: "Wallet required",
        description: "Connect a wallet to estimate gas for write methods.",
      });
      return;
    }

    setEstimatingGas((current) => ({ ...current, [functionDefinition.name]: true }));
    try {
      const contract = createContractInstance(decodedAddress, abi, signer);
      const args = collectArgs(functionDefinition, state);
      const estimate = await (contract as any).estimateGas[functionDefinition.name](...args);
      setWriteEstimations((current) => ({ ...current, [functionDefinition.name]: estimate.toString() }));
      addToast({
        type: "success",
        title: "Gas Estimated",
        description: `Estimated ${estimate.toString()} units for ${functionDefinition.name}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Gas Estimation Failed",
        description: error instanceof Error ? error.message : "Unable to estimate gas.",
      });
    } finally {
      setEstimatingGas((current) => ({ ...current, [functionDefinition.name]: false }));
    }
  };

  const handleWriteFunction = async (functionDefinition: ParsedAbiFunction) => {
    const state = getFunctionState(writeStates, functionDefinition.name);
    const validationErrors = validateFunctionInputs(functionDefinition, state);
    if (Object.keys(validationErrors).length > 0) {
      updateFunctionState(setWriteStates, functionDefinition.name, { errors: validationErrors });
      return;
    }

    if (!signer) {
      addToast({
        type: "error",
        title: "Wallet required",
        description: "Connect a wallet to submit write transactions.",
      });
      return;
    }

    setWriteLoading((current) => ({ ...current, [functionDefinition.name]: true }));
    try {
      const contract = createContractInstance(decodedAddress, abi, signer);
      const result = await executeWriteMethod(contract, functionDefinition.name, collectArgs(functionDefinition, state));
      setWriteResults((current) => ({ ...current, [functionDefinition.name]: result.txHash ? `Broadcasted ${result.txHash.slice(0, 12)}...` : "Broadcasted" }));
      addToast({
        type: "success",
        title: "Transaction Broadcasted",
        description: `${functionDefinition.name} was submitted successfully.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Write Failed",
        description: error instanceof Error ? error.message : "Unable to send contract transaction.",
      });
    } finally {
      setWriteLoading((current) => ({ ...current, [functionDefinition.name]: false }));
    }
  };

  const renderParameterInput = (parameter: ParsedAbiParameter, functionName: string, path: string[] = [getParameterLabel(parameter)]) => {
    const parameterName = getParameterLabel(parameter);
    const currentValue = getValueAtPath(
      path.length === 1 && readStates[functionName]?.values ? readStates[functionName].values : writeStates[functionName]?.values ?? {},
      path
    );

    const error = getErrorAtPath(readStates[functionName]?.errors ?? writeStates[functionName]?.errors ?? {}, path);

    const handleChange = (nextValue: unknown) => {
      updateFunctionValue(setReadStates, functionName, path, nextValue);
      updateFunctionValue(setWriteStates, functionName, path, nextValue);
    };

    const sharedProps = {
      className: "h-9 py-1! text-xs",
    };

    if (parameter.isTuple && parameter.components.length > 0) {
      return (
        <div className="space-y-3 rounded-lg border border-border-default bg-bg-secondary p-3">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          {parameter.components.map((component) => (
            <div key={`${functionName}-${parameterName}-${component.name || component.type}`} className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {component.name || component.type} <span className="ml-1 text-text-muted">{component.type}</span>
              </label>
              {renderParameterInput(component, functionName, [...path, component.name || component.type])}
            </div>
          ))}
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    if (parameter.isArray) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          <textarea
            value={typeof currentValue === "string" ? currentValue : Array.isArray(currentValue) ? currentValue.join(", ") : ""}
            onChange={(event) => handleChange(event.target.value)}
            rows={3}
            placeholder="1, 2, 3"
            className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    const normalizedType = parameter.type.toLowerCase();
    if (normalizedType.startsWith("bool")) {
      return (
        <div className="space-y-1">
          <label className="inline-flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(event) => handleChange(event.target.checked)}
            />
            {parameterName}
          </label>
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    if (normalizedType.startsWith("address")) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          <Input
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="0x..."
            inputMode="text"
            {...sharedProps}
          />
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    if (normalizedType.startsWith("uint") || normalizedType.startsWith("int")) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          <Input
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="0"
            type="number"
            inputMode="numeric"
            {...sharedProps}
          />
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    if (normalizedType.startsWith("string")) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          <textarea
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => handleChange(event.target.value)}
            rows={3}
            placeholder="Enter string"
            className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    if (normalizedType.startsWith("bytes")) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
          </label>
          <Input
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="0x..."
            className="h-9 py-1! text-xs"
          />
          {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          {parameterName} <span className="text-text-tertiary">({parameter.type})</span>
        </label>
        <Input
          value={typeof currentValue === "string" ? currentValue : ""}
          onChange={(event) => handleChange(event.target.value)}
          {...sharedProps}
        />
        {error ? <p className="text-[11px] text-state-error">{error}</p> : null}
      </div>
    );
  };

  const renderFunctionCard = (functionDefinition: ParsedAbiFunction, kind: "read" | "write") => {
    const functionState = kind === "read"
      ? getFunctionState(readStates, functionDefinition.name)
      : getFunctionState(writeStates, functionDefinition.name);
    const loading = kind === "read"
      ? Boolean(readLoading[functionDefinition.name])
      : Boolean(writeLoading[functionDefinition.name]);
    const result = kind === "read"
      ? readResults[functionDefinition.name]
      : writeResults[functionDefinition.name];

    return (
      <Card key={functionDefinition.name} className="p-0">
        <CardHeader className="py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">{functionDefinition.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">{functionDefinition.stateMutability}</p>
            </div>
            <div className="rounded-full border border-border-default px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {kind === "read" ? "Read" : "Write"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {functionDefinition.inputs.length > 0 ? (
            <div className="space-y-3">
              {functionDefinition.inputs.map((parameter) => (
                <div key={`${functionDefinition.name}-${parameter.name || parameter.type}`}>
                  {renderParameterInput(parameter, functionDefinition.name)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">This method does not require any parameters.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {kind === "read" ? (
              <Button variant="outline" size="sm" onClick={() => handleReadFunction(functionDefinition)} disabled={loading}>
                {loading ? "Querying..." : "Execute"}
              </Button>
            ) : (
              <>
                <Button variant="primary" size="sm" onClick={() => handleWriteFunction(functionDefinition)} disabled={loading}>
                  {loading ? "Broadcasting..." : "Execute"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => estimateGasForFunction(functionDefinition)} disabled={Boolean(estimatingGas[functionDefinition.name])}>
                  {estimatingGas[functionDefinition.name] ? "Estimating..." : "Estimate Gas"}
                </Button>
              </>
            )}
          </div>
          {result ? (
            <div className="rounded-lg border border-border-default bg-bg-secondary p-3 text-sm text-text-primary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Result</p>
              <p className="mt-1 break-all font-mono text-xs">{result}</p>
            </div>
          ) : null}
          {kind === "write" && writeResults[functionDefinition.name] ? (
            <div className="rounded-lg border border-border-default bg-bg-secondary p-3 text-sm text-text-primary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Transaction status</p>
              <p className="mt-1 break-all font-mono text-xs">{writeResults[functionDefinition.name]}</p>
            </div>
          ) : null}

          {kind === "write" ? (
            <div className="rounded-lg border border-border-default bg-bg-secondary p-3 text-sm text-text-secondary">
              <div className="flex items-center justify-between gap-2">
                <span>Wallet status</span>
                <span className="font-semibold text-text-primary">
                  {walletStatus === "connected" ? walletAddress : walletStatus === "disconnected" ? "Disconnected" : "Wallet not installed"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span>Gas estimation</span>
                <span className="font-semibold text-text-primary">{writeEstimations[functionDefinition.name] || "Not estimated"}</span>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-border-default bg-bg-secondary p-3 text-sm text-text-primary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Output</p>
              <p className="mt-1 break-all font-mono text-xs">{result}</p>
            </div>
          ) : null}

          {kind === "write" && writeResults[functionDefinition.name] ? (
            <div className="rounded-lg border border-border-default bg-bg-secondary p-3 text-sm text-text-primary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Transaction status</p>
              <p className="mt-1 break-all font-mono text-xs">{writeResults[functionDefinition.name]}</p>
            </div>
          ) : null}

          {Object.keys(functionState.errors).length > 0 ? (
            <div className="rounded-lg border border-state-error/20 bg-state-error/10 p-3 text-sm text-state-error">
              {Object.values(functionState.errors).map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
          <FileCode className="h-6 w-6 text-emerald-500" />
          Contract Interface: <span className="font-mono text-sm sm:text-base">{decodedAddress}</span>
        </h1>
      </div>

      <Card className="p-0">
        <CardHeader className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Wallet status</p>
            <p className="text-xs text-text-tertiary">
              {walletStatus === "connected"
                ? `Connected: ${walletAddress}`
                : walletStatus === "disconnected"
                ? "Wallet is disconnected"
                : "No compatible wallet detected."}
            </p>
          </div>
          {walletStatus !== "connected" ? (
            <Button variant="secondary" size="sm" onClick={connectWallet}>
              {walletStatus === "not-installed" ? "Install Wallet" : "Connect Wallet"}
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="py-4">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : isNotVerified ? (
        <ErrorState
          title="Contract not verified"
          description="This contract has not been verified. Its interface cannot be generated."
          onRetry={() => refetch()}
        />
      ) : isInvalidAbi ? (
        <ErrorState
          title="Invalid ABI"
          description="The ABI returned by the provider is invalid or unsupported."
          onRetry={() => refetch()}
        />
      ) : isNetworkFailure ? (
        <ErrorState
          title="Network issue"
          description="The ABI provider could not be reached. Please retry."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-emerald-500" />
                Read State Methods
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {readFunctions.length === 0 ? (
                <p className="text-sm text-text-tertiary">No read methods are available for this contract.</p>
              ) : (
                readFunctions.map((functionDefinition) => renderFunctionCard(functionDefinition, "read"))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Play className="h-4 w-4 text-emerald-500 animate-pulse" />
                Write State Transitions
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {writeFunctions.length === 0 ? (
                <p className="text-sm text-text-tertiary">No write methods are available for this contract.</p>
              ) : (
                writeFunctions.map((functionDefinition) => renderFunctionCard(functionDefinition, "write"))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
