#include <stdio.h>
#include <string.h>
#include "vm_scheduler.h"

int findLRU(int time[], int n) {
    int min = time[0], pos = 0;
    for (int i = 1; i < n; i++) {
        if (time[i] < min) {
            min = time[i];
            pos = i;
        }
    }
    return pos;
}

int simulateLRU(int frames, int ref[], int n) {
    int frame[MAX_FRAMES], time[MAX_FRAMES];
    int faults = 0, counter = 0;

    for (int i = 0; i < frames; i++)
        frame[i] = -1;

    for (int i = 0; i < n; i++) {
        int found = 0;
        for (int j = 0; j < frames; j++) {
            if (frame[j] == ref[i]) {
                found = 1;
                counter++;
                time[j] = counter;
                break;
            }
        }

        if (!found) {
            int pos = -1;
            for (int j = 0; j < frames; j++) {
                if (frame[j] == -1) {
                    pos = j;
                    break;
                }
            }

            if (pos == -1)
                pos = findLRU(time, frames);

            frame[pos] = ref[i];
            counter++;
            time[pos] = counter;
            faults++;
        }
    }
    return faults;
}
const char* chooseScheduler(int faults) {
    if (faults > 5)
        return "SJF";
    else if (faults >= 3)
        return "PRIORITY";
    else
        return "ROUND_ROBIN";
}
int main() {
    FILE *fin = fopen("input.txt", "r");
    FILE *fout = fopen("output.txt", "w");

    int n;
    fscanf(fin, "%d", &n);

    fprintf(fout, "Process Faults Scheduler\n");

    for (int i = 0; i < n; i++) {
        char pid[5];
        int burst, priority, frames;
        int ref[MAX_REF];

        fscanf(fin, "%s %d %d %d", pid, &burst, &priority, &frames);

        int k = 0;
        while (fscanf(fin, "%d", &ref[k]) == 1) {
            if (fin->_cnt == 0 || k >= MAX_REF - 1) break;
            k++;
        }

        int faults = simulateLRU(frames, ref, k);
        const char *scheduler = chooseScheduler(faults);

        fprintf(fout, "%s %d %s\n", pid, faults, scheduler);
    }

    fclose(fin);
    fclose(fout);
    return 0;
}
