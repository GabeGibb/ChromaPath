import { useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Spinner, Switch } from 'tamagui';
import { Home, RefreshCw, Hash, Vibrate } from '@tamagui/lucide-icons';

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
    hapticsEnabled,
    generateBoard,
    refreshPaths,
    setShowNumbers,
    setHapticsEnabled,
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
          backgroundColor="transparent"
          onPress={handleGoHome}
          icon={<Home size={22} color="$colorSubtle" />}
        />
        <Text fontSize="$5" fontWeight="500" color="$colorSubtle" fontFamily="$heading">
          ChromaPath
        </Text>
        <XStack gap="$2">
          <Button
            size="$3"
            circular
            backgroundColor={hapticsEnabled ? '$primary' : 'transparent'}
            onPress={() => setHapticsEnabled(!hapticsEnabled)}
            icon={<Vibrate size={20} color={hapticsEnabled ? 'white' : '$colorSubtle'} />}
          />
          <Button
            size="$3"
            circular
            backgroundColor={showNumbers ? '$primary' : 'transparent'}
            onPress={() => setShowNumbers(!showNumbers)}
            icon={<Hash size={20} color={showNumbers ? 'white' : '$colorSubtle'} />}
          />
        </XStack>
      </XStack>

      {/* Game Board */}
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$2">
        {isGenerating ? (
          <YStack alignItems="center" gap="$3">
            <Spinner size="large" color="$primary" />
            <Text color="$colorSubtle" fontSize="$3">Generating...</Text>
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
            backgroundColor="rgba(26, 26, 46, 0.95)"
            alignItems="center"
            justifyContent="center"
            gap="$3"
            padding="$4"
          >
            <Text fontSize="$8" fontWeight="600" color="$primary">
              Complete
            </Text>
            <Text fontSize="$5" color="$colorSubtle" fontFamily="$mono">
              {formatGameTime(timer)}
            </Text>
            <XStack gap="$3" marginTop="$3">
              <Button
                size="$4"
                backgroundColor="$primary"
                color="white"
                onPress={handleNewGame}
              >
                New Game
              </Button>
              <Button
                size="$4"
                backgroundColor="transparent"
                borderWidth={1}
                borderColor="$colorSubtle"
                color="$color"
                onPress={handleRefresh}
              >
                Replay
              </Button>
            </XStack>
            <Button
              size="$3"
              backgroundColor="transparent"
              color="$colorSubtle"
              onPress={handleGoHome}
              marginTop="$1"
            >
              Change Size
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Footer - Stats & Controls inline */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingVertical="$2"
        paddingHorizontal="$3"
      >
        {/* Stats */}
        <XStack gap="$4" alignItems="center">
          <Text fontSize="$4" color="$colorSubtle">
            {numConnectedPaths}/{totalPaths}
          </Text>
          <Text fontSize="$4" color="$primary" fontFamily="$mono">
            {formatGameTime(timer)}
          </Text>
        </XStack>

        {/* Controls */}
        <XStack gap="$2" alignItems="center">
          <Button
            size="$3"
            backgroundColor="$primary"
            color="white"
            onPress={handleNewGame}
            disabled={isGenerating}
          >
            New
          </Button>
          <Button
            size="$3"
            circular
            backgroundColor="transparent"
            onPress={handleRefresh}
            disabled={isGenerating}
            icon={<RefreshCw size={20} color="$colorSubtle" />}
          />
        </XStack>
      </XStack>
    </YStack>
  );
}
