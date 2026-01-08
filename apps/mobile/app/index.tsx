import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { YStack, XStack, Text, Button, Slider } from 'tamagui';
import { Play } from '@tamagui/lucide-icons';

import {
  MIN_BOARD_WIDTH,
  MAX_BOARD_WIDTH,
  MIN_BOARD_HEIGHT,
  MAX_BOARD_HEIGHT,
} from '@chromapath/shared-types';
import { useGameStore } from '@/stores/gameStore';

// Rainbow colors for each letter of "ChromaPath"
const TITLE_LETTERS = [
  { letter: 'C', color: '#ff0000' },
  { letter: 'h', color: '#ff4000' },
  { letter: 'r', color: '#ff8000' },
  { letter: 'o', color: '#ffc000' },
  { letter: 'm', color: '#ffff00' },
  { letter: 'a', color: '#80ff00' },
  { letter: 'P', color: '#00ff40' },
  { letter: 'a', color: '#00ffff' },
  { letter: 't', color: '#0080ff' },
  { letter: 'h', color: '#8000ff' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { generateBoard } = useGameStore();

  const [boardWidth, setBoardWidth] = useState(5);
  const [boardHeight, setBoardHeight] = useState(5);

  const handleStartGame = async () => {
    await generateBoard(boardWidth, boardHeight);
    router.push('/game');
  };

  // Calculate title size to fit the width - make it responsive
  const titleFontSize = Math.min(screenWidth * 0.095, 48);

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top + 10}
      paddingBottom={insets.bottom}
      paddingHorizontal="$4"
      justifyContent="space-between"
    >
      {/* Header with Rainbow Title */}
      <YStack alignItems="center" gap="$2">
        <XStack justifyContent="center" flexWrap="nowrap">
          {TITLE_LETTERS.map((item, index) => (
            <Text
              key={index}
              fontSize={titleFontSize}
              fontWeight="bold"
              fontFamily="$heading"
              color={item.color}
            >
              {item.letter}
            </Text>
          ))}
        </XStack>
        <Text fontSize="$4" color="$placeholderColor">
          Connect the colors
        </Text>
      </YStack>

      {/* Board Size Selection */}
      <YStack gap="$5" paddingHorizontal="$2">
        {/* Width Selector */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" color="$color" fontWeight="600">
              Width
            </Text>
            <Text fontSize="$6" fontWeight="bold" color="$primary" minWidth={40} textAlign="center">
              {boardWidth}
            </Text>
          </XStack>
          <Slider
            value={[boardWidth]}
            onValueChange={(value) => setBoardWidth(value[0])}
            min={MIN_BOARD_WIDTH}
            max={MAX_BOARD_WIDTH}
            step={1}
            size="$4"
          >
            <Slider.Track backgroundColor="$backgroundHover">
              <Slider.TrackActive backgroundColor="$primary" />
            </Slider.Track>
            <Slider.Thumb
              index={0}
              circular
              size="$2"
              backgroundColor="$primary"
              borderWidth={0}
            />
          </Slider>
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$placeholderColor">{MIN_BOARD_WIDTH}</Text>
            <Text fontSize="$2" color="$placeholderColor">{MAX_BOARD_WIDTH}</Text>
          </XStack>
        </YStack>

        {/* Height Selector */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" color="$color" fontWeight="600">
              Height
            </Text>
            <Text fontSize="$6" fontWeight="bold" color="$primary" minWidth={40} textAlign="center">
              {boardHeight}
            </Text>
          </XStack>
          <Slider
            value={[boardHeight]}
            onValueChange={(value) => setBoardHeight(value[0])}
            min={MIN_BOARD_HEIGHT}
            max={MAX_BOARD_HEIGHT}
            step={1}
            size="$4"
          >
            <Slider.Track backgroundColor="$backgroundHover">
              <Slider.TrackActive backgroundColor="$primary" />
            </Slider.Track>
            <Slider.Thumb
              index={0}
              circular
              size="$2"
              backgroundColor="$primary"
              borderWidth={0}
            />
          </Slider>
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$placeholderColor">{MIN_BOARD_HEIGHT}</Text>
            <Text fontSize="$2" color="$placeholderColor">{MAX_BOARD_HEIGHT}</Text>
          </XStack>
        </YStack>

        {/* Preview */}
        <YStack
          alignItems="center"
          gap="$2"
          backgroundColor="$backgroundHover"
          padding="$4"
          borderRadius="$4"
        >
          <Text fontSize="$3" color="$placeholderColor">
            Board Size
          </Text>
          <Text fontSize="$8" fontWeight="bold" color="$color">
            {boardWidth} × {boardHeight}
          </Text>
          <Text fontSize="$2" color="$placeholderColor">
            {boardWidth * boardHeight} cells
          </Text>
        </YStack>
      </YStack>

      {/* Start Button */}
      <YStack paddingBottom="$4">
        <Button
          size="$6"
          backgroundColor="$primary"
          color="white"
          onPress={handleStartGame}
          icon={<Play size={24} color="white" />}
          fontWeight="bold"
          fontSize="$6"
        >
          Play
        </Button>
      </YStack>
    </YStack>
  );
}
