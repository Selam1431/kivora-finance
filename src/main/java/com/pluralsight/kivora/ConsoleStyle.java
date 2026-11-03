package com.pluralsight.kivora;

import jdk.swing.interop.SwingInterOpUtils;

// will handle color and visual
public class ConsoleStyle {

    // Reset the terminal to its default color
    public static final String RESET = "\u001B[0m";

    //kivora royal Amethyst theme
    public static final String PURPLE = "\u001B[38;2;196;161;255m";
    public static final String PINK = "\u001B[38;2;255;157;178m";
    public static final String GREEN = "\u001B[38;2;143;224;191m";
    public static final String WHITE = "\u001B[38;2;247;240;255m";
    public static final String MUTED = "\u001B[38;2;175;162;196m";

    // display a consistent header across kivora screens
    public static void printHeader(String title) {
        System.out.println();
        System.out.println(PURPLE +
                "==============================" + RESET);

        System.out.println(WHITE + " K I V O R A " + RESET);

        System.out.println(MUTED +
                " YOUR MONEY. YOUR CONTROL." + RESET);

        System.out.println(PURPLE +
                "==============================" + RESET);
        System.out.println(WHITE + " " + title + RESET);
        System.out.println();
    }

    // print a styled menu option
    public static void printOption(String key, String label) {

        System.out.println(
                PURPLE + "  [" + key + "] " +
                        WHITE + label + RESET
        );
    }

    // print a purple divider between sections
    public static void printDivider() {
        System.out.println(
                PURPLE +
                        "  ------------------------------------" +
                        RESET
        );
    }
}
