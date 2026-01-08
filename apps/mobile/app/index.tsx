import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { RefreshCw } from '@tamagui/lucide-icons';

import { GameBoard } from '@/components/game/GameBoard';
import { useGameStore } from '@/stores/gameStore';
import { formatGameTime } from '@chromapath/shared-types';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const {
    board,
    isGenerating,
    numConnectedPaths,
    totalPaths,
    timer,
    generateBoard,
    refreshPaths,
  } = useGameStore();

  const handleNewGame = useCallback(() => {
    generateBoard(5, 5);
  }, [generateBoard]);

  const handleRefresh = useCallback(() => {
    refreshPaths();
  }, [refreshPaths]);

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal="$4"
    >
      {/* Header */}
      <XStack justifyContent="center" paddingVertical="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          ChromaPath
        </Text>
      </XStack>

      {/* Game Board */}
      <YStack flex={1} alignItems="center" justifyContent="center">
        {isGenerating ? (
          <YStack alignItems="center" gap="$3">
            <Spinner size="large" color="$primary" />
            <Text color="$color">Generating puzzle...</Text>
          </YStack>
        ) : board ? (
          <GameBoard />
        ) : (
          <YStack alignItems="center" gap="$4">
            <Text color="$color" fontSize="$5">
              Welcome to ChromaPath!
            </Text>
            <Button
              size="$5"
              backgroundColor="$primary"
              color="white"
              onPress={handleNewGame}
            >
              Start Game
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Stats Bar */}
      {board && (
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingVertical="$3"
          gap="$4"
        >
          {/* Paths Counter */}
          <YStack
            backgroundColor="$backgroundHover"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$4"
          >
            <Text fontSize="$2" color="$placeholderColor">
              Paths
            </Text>
            <Text fontSize="$5" fontWeight="bold" color="$secondary">
              {numConnectedPaths}/{totalPaths}
            </Text>
          </YStack>

          {/* Timer */}
          <YStack
            backgroundColor="$backgroundHover"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$4"
          >
            <Text fontSize="$2" color="$placeholderColor">
              Time
            </Text>
            <Text fontSize="$5" fontWeight="bold" fontFamily="$mono" color="$primary">
              {formatGameTime(timer)}
            </Text>
          </YStack>
        </XStack>
      )}

      {/* Controls */}
      {board && (
        <XStack justifyContent="center" gap="$3" paddingBottom="$4">
          <Button
            size="$4"
            backgroundColor="$primary"
            color="white"
            onPress={handleNewGame}
            disabled={isGenerating}
          >
            New Game
          </Button>
          <Button
            size="$4"
            backgroundColor="$secondary"
            color="white"
            onPress={handleRefresh}
            disabled={isGenerating}
            icon={<RefreshCw size={18} color="white" />}
          >
            Reset
          </Button>
        </XStack>
      )}
    </YStack>
  );
}
