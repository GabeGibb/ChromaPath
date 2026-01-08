import { useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Spinner, Switch } from 'tamagui';
import { Home, RefreshCw, Hash } from '@tamagui/lucide-icons';

import { GameBoard } from '@/components/game/GameBoard';
import { useGameStore } from '@/stores/gameStore';
import { formatGameTime } from '@chromapath/shared-types';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    board,
    isGenerating,
    isCompleted,
    numConnectedPaths,
    totalPaths,
    timer,
    boardWidth,
    boardHeight,
    showNumbers,
    generateBoard,
    refreshPaths,
    setShowNumbers,
  } = useGameStore();

  // If no board, go back to home
  useEffect(() => {
    if (!board && !isGenerating) {
      router.replace('/');
    }
  }, [board, isGenerating, router]);

  const handleNewGame = useCallback(() => {
    generateBoard(boardWidth, boardHeight);
  }, [generateBoard, boardWidth, boardHeight]);

  const handleRefresh = useCallback(() => {
    refreshPaths(true);
  }, [refreshPaths]);

  const handleGoHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <Button
          size="$3"
          circular
          backgroundColor="$backgroundHover"
          onPress={handleGoHome}
          icon={<Home size={20} color="$color" />}
        />
        <Text fontSize="$6" fontWeight="bold" color="$color" fontFamily="$heading">
          ChromaPath
        </Text>
        <Button
          size="$3"
          circular
          backgroundColor={showNumbers ? '$primary' : '$backgroundHover'}
          onPress={() => setShowNumbers(!showNumbers)}
          icon={<Hash size={20} color={showNumbers ? 'white' : '$color'} />}
        />
      </XStack>

      {/* Game Board */}
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
        {isGenerating ? (
          <YStack alignItems="center" gap="$3">
            <Spinner size="large" color="$primary" />
            <Text color="$color">Generating puzzle...</Text>
          </YStack>
        ) : board ? (
          <GameBoard />
        ) : null}

        {/* Completion Overlay */}
        {isCompleted && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.8)"
            alignItems="center"
            justifyContent="center"
            gap="$4"
            padding="$6"
          >
            <Text fontSize="$9" fontWeight="bold" color="$primary">
              Complete!
            </Text>
            <Text fontSize="$6" color="white">
              Time: {formatGameTime(timer)}
            </Text>
            <XStack gap="$3" marginTop="$4">
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={handleNewGame}
              >
                New Game
              </Button>
              <Button
                size="$5"
                backgroundColor="$secondary"
                color="white"
                onPress={handleRefresh}
              >
                Replay
              </Button>
            </XStack>
            <Button
              size="$4"
              backgroundColor="transparent"
              borderWidth={1}
              borderColor="$color"
              color="$color"
              onPress={handleGoHome}
              marginTop="$2"
            >
              Change Size
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Stats Bar */}
      <XStack
        justifyContent="space-around"
        alignItems="center"
        paddingVertical="$3"
        paddingHorizontal="$4"
      >
        {/* Paths Counter */}
        <YStack
          backgroundColor="$backgroundHover"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$4"
          alignItems="center"
          minWidth={80}
        >
          <Text fontSize="$2" color="$placeholderColor">
            Paths
          </Text>
          <Text fontSize="$5" fontWeight="bold" color="$secondary">
            {numConnectedPaths}/{totalPaths}
          </Text>
        </YStack>

        {/* Board Size */}
        <YStack
          backgroundColor="$backgroundHover"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$4"
          alignItems="center"
          minWidth={80}
        >
          <Text fontSize="$2" color="$placeholderColor">
            Size
          </Text>
          <Text fontSize="$5" fontWeight="bold" color="$color">
            {boardWidth}×{boardHeight}
          </Text>
        </YStack>

        {/* Timer */}
        <YStack
          backgroundColor="$backgroundHover"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$4"
          alignItems="center"
          minWidth={100}
        >
          <Text fontSize="$2" color="$placeholderColor">
            Time
          </Text>
          <Text fontSize="$5" fontWeight="bold" color="$primary" fontFamily="$mono">
            {formatGameTime(timer)}
          </Text>
        </YStack>
      </XStack>

      {/* Controls */}
      <XStack justifyContent="center" gap="$3" paddingBottom="$4" paddingHorizontal="$4">
        <Button
          flex={1}
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
    </YStack>
  );
}
