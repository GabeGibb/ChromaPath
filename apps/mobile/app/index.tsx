import { useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWindowDimensions, FlatList, Pressable } from 'react-native';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Check, ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';

import { CATEGORIES, Category, Level, getBoardForLevel } from '@/services/boardService';
import { useProgressStore } from '@/stores/progressStore';
import { useGameStore } from '@/stores/gameStore';

// Rainbow colors for title
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

function LevelButton({
  level,
  categoryId,
  categoryColor,
  onPress,
}: {
  level: Level;
  categoryId: string;
  categoryColor: string;
  onPress: () => void;
}) {
  const isCompleted = useProgressStore((s) => s.isLevelCompleted(categoryId, level.id));
  const bestTime = useProgressStore((s) => s.getBestTime(categoryId, level.id));

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <Pressable onPress={onPress}>
      <YStack
        width={70}
        height={70}
        borderRadius="$3"
        backgroundColor={isCompleted ? categoryColor : '$backgroundHover'}
        borderWidth={2}
        borderColor={categoryColor}
        alignItems="center"
        justifyContent="center"
        margin="$1"
      >
        {isCompleted ? (
          <>
            <Check size={16} color="white" />
            <Text fontSize="$5" fontWeight="bold" color="white">
              {level.id}
            </Text>
            {bestTime && (
              <Text fontSize="$1" color="white" opacity={0.8}>
                {formatTime(bestTime)}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text fontSize="$6" fontWeight="bold" color="$color">
              {level.id}
            </Text>
            <Text fontSize="$1" color="$placeholderColor">
              {level.label}
            </Text>
          </>
        )}
      </YStack>
    </Pressable>
  );
}

function CategoryPage({
  category,
  onLevelPress,
}: {
  category: Category;
  onLevelPress: (level: Level) => void;
}) {
  const completedCount = useProgressStore((s) => s.getCompletedCount(category.id));
  const totalLevels = category.levels.length;

  // Group levels by size for visual sections
  const levelsBySize: { [key: string]: Level[] } = {};
  category.levels.forEach((level) => {
    if (!levelsBySize[level.label]) {
      levelsBySize[level.label] = [];
    }
    levelsBySize[level.label].push(level);
  });

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack padding="$3" gap="$4">
        {/* Progress bar */}
        <YStack gap="$2">
          <XStack justifyContent="space-between">
            <Text fontSize="$3" color="$placeholderColor">
              Progress
            </Text>
            <Text fontSize="$3" color={category.color} fontWeight="600">
              {completedCount}/{totalLevels}
            </Text>
          </XStack>
          <YStack
            height={6}
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            overflow="hidden"
          >
            <YStack
              height="100%"
              width={`${(completedCount / totalLevels) * 100}%`}
              backgroundColor={category.color}
              borderRadius="$4"
            />
          </YStack>
        </YStack>

        {/* Levels grouped by size */}
        {Object.entries(levelsBySize).map(([sizeLabel, levels]) => (
          <YStack key={sizeLabel} gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              {sizeLabel}
            </Text>
            <XStack flexWrap="wrap">
              {levels.map((level) => (
                <LevelButton
                  key={level.id}
                  level={level}
                  categoryId={category.id}
                  categoryColor={category.color}
                  onPress={() => onLevelPress(level)}
                />
              ))}
            </XStack>
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { setCurrentLevel } = useGameStore();

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const titleFontSize = Math.min(screenWidth * 0.095, 48);

  const handleLevelPress = async (level: Level) => {
    const board = await getBoardForLevel(level);
    setCurrentLevel(currentCategory.id, level, board);
    router.push('/game');
  };

  const goToCategory = (index: number) => {
    if (index >= 0 && index < CATEGORIES.length) {
      setCurrentCategoryIndex(index);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top + 10}
      paddingBottom={insets.bottom}
    >
      {/* Header */}
      <YStack alignItems="center" gap="$1" paddingHorizontal="$4">
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
      </YStack>

      {/* Category Tabs */}
      <XStack
        justifyContent="center"
        alignItems="center"
        paddingVertical="$3"
        gap="$2"
      >
        <Pressable onPress={() => goToCategory(currentCategoryIndex - 1)}>
          <ChevronLeft
            size={28}
            color={currentCategoryIndex > 0 ? '$color' : '$placeholderColor'}
            opacity={currentCategoryIndex > 0 ? 1 : 0.3}
          />
        </Pressable>

        <XStack gap="$2" alignItems="center">
          {CATEGORIES.map((cat, index) => (
            <Pressable key={cat.id} onPress={() => goToCategory(index)}>
              <YStack
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                backgroundColor={
                  index === currentCategoryIndex ? cat.color : 'transparent'
                }
              >
                <Text
                  fontSize="$3"
                  fontWeight={index === currentCategoryIndex ? 'bold' : 'normal'}
                  color={index === currentCategoryIndex ? 'white' : '$placeholderColor'}
                >
                  {cat.name}
                </Text>
              </YStack>
            </Pressable>
          ))}
        </XStack>

        <Pressable onPress={() => goToCategory(currentCategoryIndex + 1)}>
          <ChevronRight
            size={28}
            color={
              currentCategoryIndex < CATEGORIES.length - 1
                ? '$color'
                : '$placeholderColor'
            }
            opacity={currentCategoryIndex < CATEGORIES.length - 1 ? 1 : 0.3}
          />
        </Pressable>
      </XStack>

      {/* Category Pages */}
      <FlatList
        ref={flatListRef}
        data={CATEGORIES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentCategoryIndex(index);
        }}
        renderItem={({ item }) => (
          <YStack width={screenWidth} flex={1}>
            <CategoryPage category={item} onLevelPress={handleLevelPress} />
          </YStack>
        )}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
    </YStack>
  );
}
