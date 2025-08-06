import { View, Text } from "react-native";
import { styles } from "./styles";
import { classTranslations } from "../translation";

export type ClassificationProps = {
    probability: number;
    className: string;
}

type props = {
    data: ClassificationProps;
}

export function Classification({ data }: props) {
    return(
        <View style={styles.container}>
            <Text style={styles.probability}>
                {data.probability.toFixed(4)}
            </Text>
            <Text style={styles.className}>
                {classTranslations[data.className] ?? data.className}
            </Text>
        </View>
    )
}